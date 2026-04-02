"""TTS client — calls ai-service TTS endpoints.

Provides:
  - stream_synthesize(text, voice_id, options) -> AsyncIterator[bytes]:
      POST /tts/synthesize-stream, yields audio chunks from chunked response.
"""

import logging
from typing import Any, AsyncIterator, Dict, Optional

from .ai_service_client import AiServiceClient

logger = logging.getLogger(__name__)

DEFAULT_CHUNK_SIZE = 4096


class TtsClient(AiServiceClient):
    """HTTP client for ai-service TTS endpoints."""

    async def stream_synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[bytes]:
        """Stream audio synthesis via POST /tts/synthesize-stream.

        Sends text to the TTS endpoint and yields raw audio chunks
        from the chunked HTTP response.

        Args:
            text: The text to synthesize into speech.
            voice_id: Optional voice identifier.
            options: Optional synthesis options (speed, format, etc.).

        Yields:
            Raw audio bytes chunks.
        """
        payload: Dict[str, Any] = {"text": text}
        if voice_id is not None:
            payload["voiceId"] = voice_id
        if options:
            payload["options"] = options

        resp = await self.post("/tts/synthesize-stream", json=payload)

        async for chunk in resp.content.iter_chunked(DEFAULT_CHUNK_SIZE):
            if chunk:
                yield chunk
