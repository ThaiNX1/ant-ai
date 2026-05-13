"""STT stream service — high-level voice-streaming interface wrapping SttStreamClient.

Uses SttStreamClient (ai_client) instead of calling Deepgram API directly.
Provides methods the voice-streaming orchestrator calls for real-time STT sessions.
"""

import logging
from typing import AsyncIterator

from ai_client import SttStreamClient

logger = logging.getLogger(__name__)


class SttStreamService:
    """High-level STT streaming service for voice-streaming use cases.

    Accepts a SttStreamClient via constructor injection and provides
    orchestrator-friendly methods that delegate to ai-service.
    """

    def __init__(self, stt_stream_client: SttStreamClient) -> None:
        self._client = stt_stream_client

    @property
    def connected(self) -> bool:
        """Return True if the underlying WebSocket is connected."""
        return self._client.connected

    async def start_session(self, provider: str = "deepgram") -> None:
        """Open a streaming STT session via ai-service.

        Args:
            provider: STT provider name (default: deepgram).
        """
        logger.info("Starting STT stream session provider=%s", provider)
        await self._client.connect(provider=provider)

    async def send_audio(self, audio_chunk: bytes) -> None:
        """Feed a PCM audio chunk into the active STT session.

        Args:
            audio_chunk: Raw 16kHz PCM audio bytes.

        Raises:
            RuntimeError: if no session is active.
        """
        await self._client.send_audio(audio_chunk)

    async def receive_transcripts(self) -> AsyncIterator[dict]:
        """Yield parsed transcript event dicts from the STT session.

        Each event is a dict with fields: type, transcript, confidence,
        timestamp, and optionally message (for error events).

        Yields:
            Parsed JSON transcript event dicts from ai-service.
        """
        async for event in self._client.get_transcript_stream():
            yield event

    async def end_session(self) -> None:
        """Close the active STT session and release resources."""
        logger.info("Ending STT stream session")
        await self._client.disconnect()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self.end_session()
