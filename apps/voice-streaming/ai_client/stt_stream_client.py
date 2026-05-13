"""STT streaming WebSocket client — proxy to ai-service /stt/stream.

Provides:
  - connect(provider) -> None: open WebSocket to ws://base_url/stt/stream?provider=...
  - send_audio(chunk) -> None: send binary PCM chunk
  - get_transcript_stream() -> AsyncIterator[dict]: yield parsed JSON transcript dicts
  - disconnect() -> None: close WebSocket and cleanup
"""

import asyncio
import json
import logging
from typing import AsyncIterator, Optional

import aiohttp

logger = logging.getLogger(__name__)

RETRY_DELAYS = [1, 2, 4, 8, 16]


class SttStreamClient:
    """WebSocket client that proxies PCM audio to ai-service /stt/stream endpoint."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        """Initialize the STT stream client.

        Args:
            base_url: The ai-service base URL (e.g. http://localhost:8081).
            timeout: WebSocket connection timeout in seconds.
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._session: Optional[aiohttp.ClientSession] = None
        self._ws: Optional[aiohttp.ClientWebSocketResponse] = None

    @property
    def connected(self) -> bool:
        """Return True if the WebSocket connection is open."""
        return self._ws is not None and not self._ws.closed

    async def connect(self, provider: str = "deepgram") -> None:
        """Open a WebSocket connection to the /stt/stream endpoint.

        Retries with exponential backoff (1s, 2s, 4s, 8s, 16s) on failure.

        Args:
            provider: STT provider name passed as query parameter.

        Raises:
            ConnectionError: if all retry attempts are exhausted.
        """
        ws_url = self.base_url.replace("http://", "ws://").replace(
            "https://", "wss://"
        )
        ws_url = f"{ws_url}/stt-stream?provider={provider}"

        last_exc: Optional[Exception] = None

        for attempt, delay in enumerate([0] + RETRY_DELAYS):
            if attempt > 0:
                logger.warning(
                    "STT stream connect attempt %d failed, retrying in %ds",
                    attempt,
                    delay,
                )
                await asyncio.sleep(delay)

            try:
                self._session = aiohttp.ClientSession(
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                )
                self._ws = await self._session.ws_connect(ws_url)
                logger.info("STT stream connected to %s", ws_url)
                return
            except Exception as exc:
                last_exc = exc
                # Clean up failed session before retry
                if self._session and not self._session.closed:
                    await self._session.close()
                    self._session = None
                self._ws = None

        raise ConnectionError(
            f"Failed to connect to STT stream after {len(RETRY_DELAYS) + 1} attempts: {last_exc}"
        )

    async def send_audio(self, chunk: bytes) -> None:
        """Send a binary PCM audio chunk over the WebSocket.

        Args:
            chunk: Raw PCM audio bytes to send.

        Raises:
            RuntimeError: if not connected.
        """
        if not self.connected:
            raise RuntimeError("Not connected")
        await self._ws.send_bytes(chunk)

    async def get_transcript_stream(self) -> AsyncIterator[dict]:
        """Yield parsed JSON transcript events from the WebSocket.

        Reads messages from the WebSocket and yields each TEXT message
        as a parsed dict. Binary messages are skipped. The iterator ends
        when the connection is closed or an error occurs.

        Yields:
            Parsed JSON dict for each text message.

        Raises:
            RuntimeError: if not connected.
        """
        if not self.connected:
            raise RuntimeError("Not connected")

        async for msg in self._ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                yield json.loads(msg.data)
            elif msg.type == aiohttp.WSMsgType.ERROR:
                logger.error("STT stream WebSocket error: %s", self._ws.exception())
                break
            elif msg.type in (
                aiohttp.WSMsgType.CLOSE,
                aiohttp.WSMsgType.CLOSING,
                aiohttp.WSMsgType.CLOSED,
            ):
                break

    async def disconnect(self) -> None:
        """Close the WebSocket connection and clean up resources."""
        if self._ws and not self._ws.closed:
            await self._ws.close()
            self._ws = None
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self.disconnect()
