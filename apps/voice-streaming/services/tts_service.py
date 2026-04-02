"""TTS service — high-level voice-streaming interface wrapping TtsClient.

Uses TtsClient (ai_client) instead of calling ElevenLabs API directly.
Provides methods the voice-streaming orchestrator calls for speech synthesis.
"""

import logging
from typing import Any, AsyncIterator, Dict, Optional

from ai_client import TtsClient

logger = logging.getLogger(__name__)


class TtsService:
    """High-level TTS service for voice-streaming use cases.

    Accepts a TtsClient via constructor injection and provides
    orchestrator-friendly methods that delegate to ai-service.
    """

    def __init__(self, tts_client: TtsClient) -> None:
        self._client = tts_client

    async def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[bytes]:
        """Stream synthesized audio chunks for the given text.

        Args:
            text: The text to synthesize.
            voice_id: Optional voice identifier.
            options: Optional synthesis options (speed, format, etc.).

        Yields:
            Raw audio byte chunks from ai-service TTS endpoint.
        """
        logger.debug(
            "Synthesizing speech: text_len=%d voice_id=%s",
            len(text),
            voice_id,
        )
        async for chunk in self._client.stream_synthesize(
            text, voice_id=voice_id, options=options
        ):
            yield chunk

    async def synthesize_to_buffer(
        self,
        text: str,
        voice_id: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> bytes:
        """Synthesize text and collect all audio into a single buffer.

        Useful when the caller needs the complete audio before processing
        (e.g. for Opus encoding of a full utterance).

        Args:
            text: The text to synthesize.
            voice_id: Optional voice identifier.
            options: Optional synthesis options.

        Returns:
            Complete audio bytes.
        """
        chunks: list[bytes] = []
        async for chunk in self.synthesize_speech(text, voice_id=voice_id, options=options):
            chunks.append(chunk)
        return b"".join(chunks)
