"""Webhook route handlers for SSRC registration and deregistration."""

from __future__ import annotations

import asyncio
import logging
import traceback
from typing import Any, Dict, Optional

import aiohttp
from aiohttp import web

from ai_client import SttStreamClient
from core.session_manager import SessionMetadata
from webhook.ws_manager import BeWebSocketManager

logger = logging.getLogger(__name__)

_SSRC_MAX = 4294967295  # 2^32 - 1

# BE WebSocket endpoint for TTS streaming
_BE_WS_URL = "ws://192.168.1.208:8081/tts-stream"


def _validate_ssrc(body: Dict[str, Any]) -> tuple[Optional[int], Optional[web.Response]]:
    """Validate the ``ssrc`` field from a parsed JSON body.

    Returns ``(ssrc, None)`` on success or ``(None, error_response)`` on
    failure.
    """
    if "ssrc" not in body:
        return None, web.json_response(
            {"status": "error", "reason": "missing required field: ssrc"},
            status=400,
        )

    ssrc = body["ssrc"]

    if not isinstance(ssrc, int) or isinstance(ssrc, bool) or ssrc < 0 or ssrc > _SSRC_MAX:
        return None, web.json_response(
            {"status": "error", "reason": "ssrc must be a 32-bit unsigned integer"},
            status=400,
        )

    return ssrc, None


def _build_session_metadata(body: Dict[str, Any]) -> Optional[SessionMetadata]:
    """Extract optional ``metadata`` from the request body."""
    raw = body.get("metadata")
    if not isinstance(raw, dict):
        return None

    return SessionMetadata(
        voice_config=raw.get("voice_config"),
        session_timeout=raw.get("session_timeout"),
        ai_model=raw.get("ai_model"),
    )


def _get_ws_client_session(app: web.Application) -> aiohttp.ClientSession:
    """Get or create the shared aiohttp.ClientSession for WS connections."""
    if "ws_client_session" not in app:
        connector = aiohttp.TCPConnector(limit=0)  # unlimited for 1k+ connections
        app["ws_client_session"] = aiohttp.ClientSession(connector=connector)
    return app["ws_client_session"]


async def register_ssrc(request: web.Request) -> web.Response:
    """POST /webhook/register-ssrc — register an authenticated SSRC."""
    try:
        try:
            body = await request.json()
        except Exception:
            return web.json_response(
                {"status": "error", "reason": "invalid JSON body"},
                status=400,
            )

        ssrc, error = _validate_ssrc(body)
        if error is not None:
            return error

        metadata = _build_session_metadata(body)

        session_manager = request.app["session_manager"]
        record = session_manager.register(ssrc, metadata)

        # Create WS manager and connect to BE tts-stream
        client_session = _get_ws_client_session(request.app)
        ws_mgr = BeWebSocketManager(client_session, _BE_WS_URL, ssrc)
        await ws_mgr.connect()
        record.ws_session = ws_mgr

        # Create per-SSRC STT stream client and connect
        stt_enabled = request.app.get("stt_enabled", False)
        if stt_enabled:
            ai_service_url = request.app.get("ai_service_url", "http://localhost:8081")
            ai_service_timeout = request.app.get("ai_service_timeout", 10.0)
            stt_provider = request.app.get("stt_provider", "deepgram")
            try:
                stt_client = SttStreamClient(ai_service_url, ai_service_timeout)
                await stt_client.connect(provider=stt_provider)
                record.stt_client = stt_client
                # Start per-SSRC transcript loop if orchestrator is available
                orchestrator = request.app.get("orchestrator")
                if orchestrator is not None:
                    record.stt_transcript_task = asyncio.create_task(
                        orchestrator._stt_transcript_loop(ssrc)
                    )
                logger.info("STT stream connected for SSRC %d (provider=%s)", ssrc, stt_provider)
            except Exception:
                logger.error("Failed to start STT stream for SSRC %d", ssrc, exc_info=True)

        return web.json_response({"status": "ok", "ssrc": ssrc})

    except Exception:
        logger.error("register_ssrc failed:\n%s", traceback.format_exc())
        return web.json_response(
            {"status": "error", "reason": "internal server error"},
            status=500,
        )


async def deregister_ssrc(request: web.Request) -> web.Response:
    """POST /webhook/deregister-ssrc — deregister an SSRC and tear down session."""
    try:
        try:
            body = await request.json()
        except Exception:
            return web.json_response(
                {"status": "error", "reason": "invalid JSON body"},
                status=400,
            )

        ssrc, error = _validate_ssrc(body)
        if error is not None:
            return error

        session_manager = request.app["session_manager"]

        # Close STT stream client before removing session
        session = session_manager.get_session(ssrc)
        if session is not None:
            if session.stt_transcript_task is not None:
                session.stt_transcript_task.cancel()
                try:
                    await session.stt_transcript_task
                except asyncio.CancelledError:
                    pass
                session.stt_transcript_task = None
            if session.stt_client is not None:
                try:
                    await session.stt_client.disconnect()
                    logger.info("STT stream disconnected for SSRC %d", ssrc)
                except Exception:
                    logger.debug("Error closing STT stream for SSRC %d", ssrc, exc_info=True)
                session.stt_client = None

        # Close WS manager before removing session
        if session is not None and session.ws_session is not None:
            await session.ws_session.close()

        removed = session_manager.deregister(ssrc)

        if not removed:
            return web.json_response(
                {"status": "error", "reason": "ssrc not found"},
                status=404,
            )

        return web.json_response({"status": "ok", "ssrc": ssrc})

    except Exception:
        logger.error("deregister_ssrc failed:\n%s", traceback.format_exc())
        return web.json_response(
            {"status": "error", "reason": "internal server error"},
            status=500,
        )
