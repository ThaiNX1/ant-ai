"""RTP packet parsing and construction per RFC 3550."""

import struct
from dataclasses import dataclass, field
from typing import List


@dataclass
class RtpPacket:
    """Represents an RTP packet with header fields and audio payload.

    Header layout (RFC 3550):
        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |V=2|P|X|  CC   |M|     PT      |       sequence number         |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                           timestamp                           |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                             SSRC                              |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    """

    version: int          # 2 bits, must be 2
    padding: bool         # 1 bit
    extension: bool       # 1 bit
    csrc_count: int       # 4 bits
    marker: bool          # 1 bit
    payload_type: int     # 7 bits
    sequence_number: int  # 16 bits
    timestamp: int        # 32 bits
    ssrc: int             # 32 bits
    csrc_list: List[int] = field(default_factory=list)  # 0..15 CSRC identifiers
    payload: bytes = b""  # audio payload

    @classmethod
    def parse(cls, data: bytes) -> "RtpPacket":
        """Parse raw bytes into an RtpPacket.

        Raises ValueError if version != 2 or data is too short.
        """
        if len(data) < 12:
            raise ValueError(
                f"RTP packet too short: {len(data)} bytes, minimum is 12"
            )

        # Unpack fixed 12-byte header
        byte0, byte1, sequence_number, timestamp, ssrc = struct.unpack(
            "!BBHII", data[:12]
        )

        # Byte 0: V(2) P(1) X(1) CC(4)
        version = (byte0 >> 6) & 0x03
        padding = bool((byte0 >> 5) & 0x01)
        extension = bool((byte0 >> 4) & 0x01)
        csrc_count = byte0 & 0x0F

        # Byte 1: M(1) PT(7)
        marker = bool((byte1 >> 7) & 0x01)
        payload_type = byte1 & 0x7F

        if version != 2:
            raise ValueError(f"Invalid RTP version: {version}, expected 2")

        # CSRC list follows the fixed header
        csrc_end = 12 + csrc_count * 4
        if len(data) < csrc_end:
            raise ValueError(
                f"RTP packet too short for {csrc_count} CSRC entries: "
                f"{len(data)} bytes, need at least {csrc_end}"
            )

        csrc_list: List[int] = []
        for i in range(csrc_count):
            offset = 12 + i * 4
            (csrc_id,) = struct.unpack("!I", data[offset : offset + 4])
            csrc_list.append(csrc_id)

        payload = data[csrc_end:]

        return cls(
            version=version,
            padding=padding,
            extension=extension,
            csrc_count=csrc_count,
            marker=marker,
            payload_type=payload_type,
            sequence_number=sequence_number,
            timestamp=timestamp,
            ssrc=ssrc,
            csrc_list=csrc_list,
            payload=payload,
        )

    def build(self) -> bytes:
        """Serialize this RtpPacket into raw bytes."""
        # Byte 0: V(2) P(1) X(1) CC(4)
        byte0 = (
            ((self.version & 0x03) << 6)
            | (int(self.padding) << 5)
            | (int(self.extension) << 4)
            | (self.csrc_count & 0x0F)
        )

        # Byte 1: M(1) PT(7)
        byte1 = (int(self.marker) << 7) | (self.payload_type & 0x7F)

        header = struct.pack(
            "!BBHII",
            byte0,
            byte1,
            self.sequence_number & 0xFFFF,
            self.timestamp & 0xFFFFFFFF,
            self.ssrc & 0xFFFFFFFF,
        )

        # Append CSRC list
        csrc_data = b"".join(
            struct.pack("!I", csrc_id & 0xFFFFFFFF) for csrc_id in self.csrc_list
        )

        return header + csrc_data + self.payload
