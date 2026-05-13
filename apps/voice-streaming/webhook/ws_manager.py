"""WebSocket connection manager with automatic reconnect for BE tts-stream."""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import aiohttp

logger = logging.getLogger(__name__)

# Reconnect settings
_MAX_RECONNECT_ATTEMPTS = 5
_BASE_RECONNECT_DELAY = 1.0  # seconds
_MAX_RECONNECT_DELAY = 30.0  # seconds


class BeWebSocketManager:
    """Manages a single WebSocket connection to the BE tts-stream endpoint.

    Provides automatic reconnection with exponential backoff when the
    connection drops.  Each SSRC session gets its own manager instance.

    Usage::

        mgr = BeWebSocketManager(client_session, ws_url, ssrc)
        await mgr.connect()

        # Before sending a message, ensure the connection is alive:
        ws = await mgr.ensure_connected()
        if ws is not None:
            await ws.send_json({"event": "synthesize", "text": "hello"})

        # On session teardown:
        await mgr.close()
    """

    def __init__(
        self,
        client_session: aiohttp.ClientSession,
        ws_url: str,
        ssrc: int,
    ) -> None:
        self._client_session = client_session
        self._ws_url = ws_url
        self._ssrc = ssrc
        self._ws: Optional[aiohttp.ClientWebSocketResponse] = None
        self._closed = False
        self._reconnect_task: Optional[asyncio.Task] = None

    @property
    def connected(self) -> bool:
        """Return True if the WebSocket is open."""
        return self._ws is not None and not self._ws.closed

    @property
    def ws(self) -> Optional[aiohttp.ClientWebSocketResponse]:
        """Return the raw WebSocket (may be None or closed)."""
        return self._ws

    async def connect(self) -> bool:
        """Open the initial WebSocket connection.

        Returns True on success, False on failure.
        """
        if self._closed:
            return False

        try:
            self._ws = await self._client_session.ws_connect(self._ws_url)
            logger.info(
                "WebSocket connected to %s for SSRC %d", self._ws_url, self._ssrc
            )
            return True
        except Exception:
            logger.error(
                "Failed to connect WebSocket to %s for SSRC %d",
                self._ws_url, self._ssrc, exc_info=True,
            )
            return False

    async def ensure_connected(self) -> Optional[aiohttp.ClientWebSocketResponse]:
        """Return an open WebSocket, reconnecting if necessary.

        Returns None if the manager has been closed or reconnect fails
        after all retry attempts.
        """
        if self._closed:
            return None

        if self.connected:
            return self._ws

        # Connection is dead — attempt reconnect with backoff
        logger.warning("WebSocket lost for SSRC %d, attempting reconnect", self._ssrc)
        reconnected = await self._reconnect_with_backoff()
        return self._ws if reconnected else None

    async def _reconnect_with_backoff(self) -> bool:
        """Try to reconnect with exponential backoff.

        Returns True if reconnection succeeded.
        """
        delay = _BASE_RECONNECT_DELAY

        for attempt in range(1, _MAX_RECONNECT_ATTEMPTS + 1):
            if self._closed:
                return False

            logger.info(
                "Reconnect attempt %d/%d for SSRC %d (delay %.1fs)",
                attempt, _MAX_RECONNECT_ATTEMPTS, self._ssrc, delay,
            )

            await asyncio.sleep(delay)

            try:
                self._ws = await self._client_session.ws_connect(self._ws_url)
                logger.info(
                    "WebSocket reconnected to %s for SSRC %d (attempt %d)",
                    self._ws_url, self._ssrc, attempt,
                )
                return True
            except Exception:
                logger.warning(
                    "Reconnect attempt %d failed for SSRC %d",
                    attempt, self._ssrc, exc_info=True,
                )

            # Exponential backoff with cap
            delay = min(delay * 2, _MAX_RECONNECT_DELAY)

        logger.error(
            "All %d reconnect attempts failed for SSRC %d",
            _MAX_RECONNECT_ATTEMPTS, self._ssrc,
        )
        return False

    async def close(self) -> None:
        """Close the WebSocket and mark this manager as done."""
        self._closed = True

        if self._ws is not None and not self._ws.closed:
            try:
                await self._ws.close()
                logger.info("WebSocket closed for SSRC %d", self._ssrc)
            except Exception:
                logger.error(
                    "Error closing WebSocket for SSRC %d",
                    self._ssrc, exc_info=True,
                )

        self._ws = None
