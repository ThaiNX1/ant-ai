"""UDP server for RTP packet reception and transmission using asyncio.DatagramProtocol."""

import asyncio
import logging
from typing import Awaitable, Callable, Optional, Tuple

logger = logging.getLogger(__name__)


class RtpUdpProtocol(asyncio.DatagramProtocol):
    """asyncio DatagramProtocol that receives RTP datagrams and delegates to an async callback."""

    def __init__(
        self,
        packet_callback: Callable[[bytes, Tuple[str, int]], Awaitable[None]],
    ):
        self._packet_callback = packet_callback
        self._transport: Optional[asyncio.DatagramTransport] = None

    def connection_made(self, transport: asyncio.DatagramTransport) -> None:
        """Store the transport reference."""
        self._transport = transport

    def datagram_received(self, data: bytes, addr: Tuple[str, int]) -> None:
        """Schedule the async callback via asyncio.ensure_future."""
        asyncio.ensure_future(self._packet_callback(data, addr))

    def error_received(self, exc: Exception) -> None:
        """Log OS-level errors, do not crash."""
        logger.error("UDP error received: %s", exc)

    def send_to(self, data: bytes, addr: Tuple[str, int]) -> None:
        """Send a UDP datagram to the specified address via transport.sendto()."""
        if self._transport is not None:
            self._transport.sendto(data, addr)

    def close(self) -> None:
        """Close the transport."""
        if self._transport is not None:
            self._transport.close()
