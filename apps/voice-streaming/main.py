"""Voice-streaming application entry point.

Loads configuration, creates all clients/services, and starts the Orchestrator.
STT streaming is per-SSRC — each robot gets its own WebSocket to ai-service.
Run with: python main.py
"""

import asyncio
import logging
import os
import signal

from ai_client import RealtimeClient, TtsClient
from core.config import AppConfig
from core.orchestrator import Orchestrator
from core.session_manager import SessionManager
from rtp_handler.opus_codec import OpusCodec
from services.realtime_service import RealtimeService
from services.tts_service import TtsService

logger = logging.getLogger(__name__)


async def main() -> None:
    """Bootstrap and run the voice-streaming application."""
    # 1. Load configuration
    config = AppConfig.from_env()

    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logger.info("Starting voice-streaming application")

    # 2. Core components
    session_manager = SessionManager(default_idle_timeout=config.session_idle_timeout)
    opus_codec = OpusCodec()

    # 3. AI clients (STT is per-SSRC, created in webhook handlers)
    realtime_client = RealtimeClient(config.ai_service_url, config.ai_service_timeout)
    tts_client = TtsClient(config.ai_service_url, config.ai_service_timeout)

    # 4. AI services
    realtime_service = RealtimeService(realtime_client)
    tts_service = TtsService(tts_client)

    # 5. Orchestrator (STT per-SSRC — no shared stt_stream_service)
    orchestrator = Orchestrator(
        session_manager=session_manager,
        opus_codec=opus_codec,
        realtime_service=realtime_service,
        tts_service=tts_service,
        config=config,
    )

    # 6. Shutdown handler
    loop = asyncio.get_running_loop()
    shutdown_event = asyncio.Event()

    def _signal_handler() -> None:
        logger.info("Received shutdown signal")
        shutdown_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _signal_handler)

    # 7. Start and wait for shutdown
    await orchestrator.start()
    logger.info("Voice-streaming application running")

    await shutdown_event.wait()

    logger.info("Shutting down voice-streaming application")
    await orchestrator.stop()

    # Cleanup clients
    await realtime_client.disconnect()
    await tts_client.close()

    logger.info("Voice-streaming application stopped")


if __name__ == "__main__":
    asyncio.run(main())
