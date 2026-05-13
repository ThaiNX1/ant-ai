"""Core orchestrator — ties webhook auth, RTP handling, and AI services together."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, Optional, Tuple

from aiohttp import web

from core.config import AppConfig
from core.session_manager import SessionManager
from rtp_handler.opus_codec import OpusCodec
from rtp_handler.rtp_packet import RtpPacket
from rtp_handler.udp_server import RtpUdpProtocol
from services.realtime_service import RealtimeService
from services.tts_service import TtsService
from webhook.webhook_routes import setup_webhook_routes

logger = logging.getLogger(__name__)


class Orchestrator:
    """Central coordinator for the voice-streaming application.

    Manages the HTTP control server (webhooks), UDP RTP socket,
    idle-session cleanup, and the bridge between RTP audio and
    AI services (RealtimeService / TtsService).
    """

    def __init__(
        self,
        session_manager: SessionManager,
        opus_codec: OpusCodec,
        realtime_service: RealtimeService,
        tts_service: TtsService,
        config: AppConfig,
    ) -> None:
        self._session_manager = session_manager
        self._opus_codec = opus_codec
        self._realtime_service = realtime_service
        self._tts_service = tts_service
        self._config = config

        self._udp_protocol: Optional[RtpUdpProtocol] = None
        self._http_runner: Optional[web.AppRunner] = None
        self._cleanup_task: Optional[asyncio.Task] = None

        # Per-SSRC outgoing RTP state: {ssrc: (sequence_number, timestamp)}
        self._rtp_state: Dict[int, Dict[str, int]] = {}

    async def start(self) -> None:
        """Start HTTP server, UDP socket, and idle-session cleanup task."""
        # 1. Create aiohttp Application with webhook routes
        app = web.Application()
        app["webhook_secret"] = self._config.webhook_secret
        # Pass STT config so webhook handlers can create per-SSRC STT clients
        app["stt_enabled"] = self._config.stt_enabled
        app["stt_provider"] = self._config.stt_provider
        app["ai_service_url"] = self._config.ai_service_url
        app["ai_service_timeout"] = self._config.ai_service_timeout
        app["orchestrator"] = self
        setup_webhook_routes(app, self._session_manager)

        # 2. Start aiohttp runner on control_port
        self._http_runner = web.AppRunner(app)
        await self._http_runner.setup()
        site = web.TCPSite(self._http_runner, "0.0.0.0", self._config.control_port)
        await site.start()
        logger.info("HTTP control server started on port %d", self._config.control_port)

        # 3. Create UDP endpoint with RtpUdpProtocol
        loop = asyncio.get_running_loop()
        _, protocol = await loop.create_datagram_endpoint(
            lambda: RtpUdpProtocol(self.handle_rtp_packet),
            local_addr=("0.0.0.0", self._config.rtp_port),
        )
        self._udp_protocol = protocol
        logger.info("UDP RTP socket bound on port %d", self._config.rtp_port)

        # 4. Start idle cleanup loop
        self._cleanup_task = asyncio.create_task(self._idle_cleanup_loop())

        logger.info("Orchestrator started")

    async def stop(self) -> None:
        """Graceful shutdown: close sessions, UDP, HTTP, AI clients."""
        logger.info("Orchestrator shutting down")

        # 1. Cancel cleanup task
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

        # 2. Close all active sessions (including WS managers and STT clients)
        for ssrc, record in list(self._session_manager._sessions.items()):
            # Close per-SSRC STT transcript task
            if record.stt_transcript_task is not None:
                record.stt_transcript_task.cancel()
                try:
                    await record.stt_transcript_task
                except asyncio.CancelledError:
                    pass
            # Close per-SSRC STT client
            if record.stt_client is not None:
                try:
                    await record.stt_client.disconnect()
                except Exception:
                    logger.debug("Error closing STT for SSRC %d during shutdown", ssrc)
            # Close BE WS manager
            if record.ws_session is not None:
                try:
                    await record.ws_session.close()
                except Exception:
                    logger.debug("Error closing WS for SSRC %d during shutdown", ssrc)
            self._session_manager.deregister(ssrc)
            self._rtp_state.pop(ssrc, None)

        # 3. Close UDP protocol
        if self._udp_protocol is not None:
            self._udp_protocol.close()
            self._udp_protocol = None

        # 4. Stop HTTP runner
        if self._http_runner is not None:
            await self._http_runner.cleanup()
            self._http_runner = None

        # 5. End realtime service session
        try:
            if self._realtime_service.connected:
                await self._realtime_service.end_session()
        except Exception:
            logger.exception("Error closing realtime service session")

        logger.info("Orchestrator stopped")

    async def handle_rtp_packet(self, data: bytes, addr: Tuple[str, int]) -> None:
        """Process an incoming UDP datagram.

        Flow: parse RTP → check SSRC auth → update activity →
        decode Opus → start AI session if needed → forward PCM.
        """
        # 1. Parse RTP packet
        try:
            packet = RtpPacket.parse(data)
        except ValueError as exc:
            logger.debug("Discarding invalid RTP packet from %s: %s", addr, exc)
            return

        ssrc = packet.ssrc

        # 2. Check SSRC authentication
        if not self._session_manager.is_authenticated(ssrc):
            logger.debug("Dropping packet from unauthenticated SSRC %d", ssrc)
            return

        # 3. Update activity
        self._session_manager.update_activity(ssrc, addr)

        # 4. Decode Opus payload
        pcm_data = self._opus_codec.decode(packet.payload)
        if not pcm_data:
            return

        # 4b. Forward to STT streaming per-SSRC (non-blocking)
        # Opus decode already outputs 16kHz PCM — send directly to Deepgram
        session = self._session_manager.get_session(ssrc)
        if session is not None and session.stt_client is not None and session.stt_client.connected:
            try:
                await session.stt_client.send_audio(pcm_data)
            except Exception:
                logger.error("Failed to send audio to STT for SSRC %d", ssrc)

        # 5. Start AI session if not already started
        session = self._session_manager.get_session(ssrc)
        if session is not None and not session.ai_session_started:
            session_config: Optional[Dict[str, Any]] = None
            if session.metadata and session.metadata.ai_model:
                session_config = {"ai_model": session.metadata.ai_model}

            try:
                await self._realtime_service.start_session(session_config)
                session.ai_session_started = True
            except Exception:
                logger.error(
                    "Failed to start AI session for SSRC %d, retrying once", ssrc
                )
                try:
                    await self._realtime_service.start_session(session_config)
                    session.ai_session_started = True
                except Exception:
                    logger.error(
                        "Retry failed for SSRC %d, tearing down session", ssrc
                    )
                    self._session_manager.deregister(ssrc)
                    self._rtp_state.pop(ssrc, None)
                    return

        # 6. Forward PCM to realtime service
        try:
            await self._realtime_service.send_audio(pcm_data)
        except Exception:
            logger.error("Failed to send audio for SSRC %d", ssrc)

    async def send_rtp_response(self, ssrc: int, audio_data: bytes) -> None:
        """Encode audio to Opus, build RTP packet, send via UDP."""
        if self._udp_protocol is None:
            logger.warning("Cannot send RTP response: UDP protocol not available")
            return

        session = self._session_manager.get_session(ssrc)
        if session is None or session.client_addr is None:
            logger.warning("Cannot send RTP response: no session or client_addr for SSRC %d", ssrc)
            return

        # Encode PCM to Opus
        opus_data = self._opus_codec.encode(audio_data)

        # Get or initialise per-SSRC RTP state
        if ssrc not in self._rtp_state:
            self._rtp_state[ssrc] = {"seq": 0, "timestamp": 0}

        state = self._rtp_state[ssrc]

        # Build RTP packet
        packet = RtpPacket(
            version=2,
            padding=False,
            extension=False,
            csrc_count=0,
            marker=False,
            payload_type=111,
            sequence_number=state["seq"] & 0xFFFF,
            timestamp=state["timestamp"] & 0xFFFFFFFF,
            ssrc=ssrc,
            csrc_list=[],
            payload=opus_data,
        )

        # Increment state for next packet (320 samples = 20ms at 16kHz)
        state["seq"] = (state["seq"] + 1) & 0xFFFF
        state["timestamp"] = (state["timestamp"] + 320) & 0xFFFFFFFF

        # Send via UDP
        self._udp_protocol.send_to(packet.build(), session.client_addr)

    async def _idle_cleanup_loop(self) -> None:
        """Periodic task that removes idle sessions."""
        try:
            while True:
                await asyncio.sleep(self._config.session_idle_timeout)

                # Collect WS managers and STT clients before cleanup removes the sessions
                ws_managers_to_close = []
                stt_clients_to_close = []
                for ssrc, record in self._session_manager._sessions.items():
                    timeout = self._session_manager._default_idle_timeout
                    if record.metadata and record.metadata.session_timeout is not None:
                        timeout = record.metadata.session_timeout
                    if time.monotonic() - record.last_activity > timeout:
                        if record.ws_session is not None:
                            ws_managers_to_close.append((ssrc, record.ws_session))
                        if record.stt_client is not None:
                            stt_clients_to_close.append((ssrc, record.stt_client, record.stt_transcript_task))

                expired = self._session_manager.cleanup_idle_sessions()
                if expired:
                    logger.info("Cleaned up %d idle sessions: %s", len(expired), expired)
                    for ssrc in expired:
                        self._rtp_state.pop(ssrc, None)

                # Close STT clients for expired sessions
                for ssrc, stt_client, stt_task in stt_clients_to_close:
                    if stt_task is not None:
                        stt_task.cancel()
                        try:
                            await stt_task
                        except asyncio.CancelledError:
                            pass
                    try:
                        await stt_client.disconnect()
                    except Exception:
                        logger.debug("Error closing STT for expired SSRC %d", ssrc)

                # Close WS managers for expired sessions
                for ssrc, ws_mgr in ws_managers_to_close:
                    try:
                        await ws_mgr.close()
                    except Exception:
                        logger.debug("Error closing WS for expired SSRC %d", ssrc)

        except asyncio.CancelledError:
            logger.debug("Idle cleanup loop cancelled")

    async def _stt_transcript_loop(self, ssrc: int) -> None:
        """Consume transcript events from a per-SSRC STT client.

        Started as an asyncio.Task when an SSRC registers with STT enabled.
        """
        session = self._session_manager.get_session(ssrc)
        if session is None or session.stt_client is None:
            return

        try:
            async for event in session.stt_client.get_transcript_stream():
                event_type = event.get("type", "")
                transcript = event.get("transcript", "")

                if event_type == "speech_final" and transcript.strip():
                    logger.info("SSRC %d speech final: %s", ssrc, transcript)
                    # TODO: trigger LLM generation with transcript per-SSRC
                elif event_type == "partial":
                    logger.debug("SSRC %d partial: %s", ssrc, transcript)
                elif event_type == "error":
                    logger.error("SSRC %d STT error: %s", ssrc, event.get("message", ""))
        except asyncio.CancelledError:
            logger.debug("STT transcript loop cancelled for SSRC %d", ssrc)
        except Exception:
            logger.exception("STT transcript loop error for SSRC %d", ssrc)
