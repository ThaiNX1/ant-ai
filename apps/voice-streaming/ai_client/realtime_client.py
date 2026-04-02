"""Realtime WebSocket client — proxy to ai-service /realtime.

Provides:
  - connect(session_config) -> None: open WebSocket to ws://base_url/realtime
  - feed_audio(audio_chunk) -> None: send binary audio message
  - get_response_stream() -> AsyncIterator[dict]: yield parsed JSON responses
  - disconnect() -> None: close WebSocket
"""

import json
import logging
from typing import Any, AsyncIterator, Dict, Optional

import aiohttp

logger = logging.getLogger(__name__)


class RealtimeClient:
    """WebSocket client that proxies to ai-service /realtime endpoint."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        """Initialize the realtime client.

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

    async def connect(self, session_config: Optional[Dict[str, Any]] = None) -> None:
        """Open a WebSocket connection to the /realtime endpoint.

        Args:
            session_config: Optional session configuration sent as the
                first message after connecting.

        Raises:
            aiohttp.WSServerHandshakeError: if the handshake fails.
        """
        ws_url = self.base_url.replace("http://", "ws://").replace(
            "https://", "wss://"
        )
        ws_url = f"{ws_url}/realtime"

        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        )
        self._ws = await self._session.ws_connect(ws_url)

        if session_config:
            await self._ws.send_json(session_config)
            logger.debug("Sent session config: %s", session_config)

    async def feed_audio(self, audio_chunk: bytes) -> None:
        """Send an audio chunk over the WebSocket.

        Args:
            audio_chunk: Raw audio bytes to send.

        Raises:
            RuntimeError: if not connected.
        """
        if not self.connected:
            raise RuntimeError("RealtimeClient is not connected")
        await self._ws.send_bytes(audio_chunk)

    async def get_response_stream(self) -> AsyncIterator[dict]:
        """Yield parsed JSON responses from the WebSocket.

        Reads messages from the WebSocket and yields each one as a
        parsed dict. Binary messages are skipped. The iterator ends
        when the connection is closed or a CLOSE message is received.

        Yields:
            Parsed JSON dict for each text message.

        Raises:
            RuntimeError: if not connected.
        """
        if not self.connected:
            raise RuntimeError("RealtimeClient is not connected")

        async for msg in self._ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                yield json.loads(msg.data)
            elif msg.type == aiohttp.WSMsgType.ERROR:
                logger.error("WebSocket error: %s", self._ws.exception())
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
