"""Realtime service — high-level voice-streaming interface wrapping RealtimeClient.

Uses RealtimeClient (ai_client) instead of calling OpenAI Realtime API directly.
Provides methods the voice-streaming orchestrator calls for real-time voice sessions.
"""

import logging
from typing import Any, AsyncIterator, Dict, Optional

from ai_client import RealtimeClient

logger = logging.getLogger(__name__)


class RealtimeService:
    """High-level Realtime service for voice-streaming use cases.

    Accepts a RealtimeClient via constructor injection and provides
    orchestrator-friendly methods that delegate to ai-service.
    """

    def __init__(self, realtime_client: RealtimeClient) -> None:
        self._client = realtime_client

    @property
    def connected(self) -> bool:
        """Return True if the underlying WebSocket is connected."""
        return self._client.connected

    async def start_session(
        self,
        session_config: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Open a realtime voice session via ai-service.

        Args:
            session_config: Optional session configuration
                (model, voice, instructions, etc.).
        """
        logger.info("Starting realtime session config=%s", session_config)
        await self._client.connect(session_config=session_config)

    async def send_audio(self, audio_chunk: bytes) -> None:
        """Feed an audio chunk into the active realtime session.

        Args:
            audio_chunk: Raw audio bytes (e.g. decoded Opus frames).

        Raises:
            RuntimeError: if no session is active.
        """
        await self._client.feed_audio(audio_chunk)

    async def receive_responses(self) -> AsyncIterator[dict]:
        """Yield parsed response events from the realtime session.

        Each event is a dict that may contain transcript text,
        audio data, function calls, or session lifecycle events.

        Yields:
            Parsed JSON response dicts from ai-service.
        """
        async for response in self._client.get_response_stream():
            yield response

    async def end_session(self) -> None:
        """Close the active realtime session and release resources."""
        logger.info("Ending realtime session")
        await self._client.disconnect()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self.end_session()
