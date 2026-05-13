"""Unit tests for RtpPacket parse/build."""

import struct

import pytest

from rtp_handler.rtp_packet import RtpPacket


class TestRtpPacketParse:
    """Tests for RtpPacket.parse()."""

    def test_parse_minimal_packet(self):
        """Parse a minimal valid RTP packet (12-byte header, no CSRC, no payload)."""
        # Version=2, no padding, no extension, CC=0, marker=0, PT=96, seq=1, ts=160, ssrc=12345
        byte0 = (2 << 6)  # V=2, P=0, X=0, CC=0
        byte1 = 96         # M=0, PT=96
        data = struct.pack("!BBHII", byte0, byte1, 1, 160, 12345)

        pkt = RtpPacket.parse(data)

        assert pkt.version == 2
        assert pkt.padding is False
        assert pkt.extension is False
        assert pkt.csrc_count == 0
        assert pkt.marker is False
        assert pkt.payload_type == 96
        assert pkt.sequence_number == 1
        assert pkt.timestamp == 160
        assert pkt.ssrc == 12345
        assert pkt.csrc_list == []
        assert pkt.payload == b""

    def test_parse_with_payload(self):
        """Parse a packet with audio payload."""
        byte0 = (2 << 6)
        byte1 = 111
        payload = b"\xde\xad\xbe\xef" * 10
        data = struct.pack("!BBHII", byte0, byte1, 100, 48000, 99999) + payload

        pkt = RtpPacket.parse(data)

        assert pkt.payload_type == 111
        assert pkt.sequence_number == 100
        assert pkt.timestamp == 48000
        assert pkt.ssrc == 99999
        assert pkt.payload == payload

    def test_parse_with_marker_and_flags(self):
        """Parse a packet with marker, padding, and extension bits set."""
        byte0 = (2 << 6) | (1 << 5) | (1 << 4)  # V=2, P=1, X=1, CC=0
        byte1 = (1 << 7) | 111                     # M=1, PT=111
        data = struct.pack("!BBHII", byte0, byte1, 500, 96000, 42)

        pkt = RtpPacket.parse(data)

        assert pkt.padding is True
        assert pkt.extension is True
        assert pkt.marker is True
        assert pkt.payload_type == 111

    def test_parse_with_csrc_list(self):
        """Parse a packet with CSRC entries."""
        csrc_count = 3
        byte0 = (2 << 6) | csrc_count  # V=2, CC=3
        byte1 = 96
        header = struct.pack("!BBHII", byte0, byte1, 1, 160, 12345)
        csrc_data = struct.pack("!III", 100, 200, 300)
        payload = b"\x01\x02\x03"
        data = header + csrc_data + payload

        pkt = RtpPacket.parse(data)

        assert pkt.csrc_count == 3
        assert pkt.csrc_list == [100, 200, 300]
        assert pkt.payload == payload

    def test_parse_too_short_raises(self):
        """Packet shorter than 12 bytes raises ValueError."""
        with pytest.raises(ValueError, match="too short"):
            RtpPacket.parse(b"\x80\x60\x00\x01")

    def test_parse_invalid_version_raises(self):
        """Non-version-2 packet raises ValueError."""
        byte0 = (1 << 6)  # version=1
        byte1 = 96
        data = struct.pack("!BBHII", byte0, byte1, 1, 160, 12345)

        with pytest.raises(ValueError, match="Invalid RTP version"):
            RtpPacket.parse(data)

    def test_parse_too_short_for_csrc_raises(self):
        """Packet claiming CSRC entries but too short raises ValueError."""
        byte0 = (2 << 6) | 5  # V=2, CC=5 (needs 12 + 20 = 32 bytes)
        byte1 = 96
        data = struct.pack("!BBHII", byte0, byte1, 1, 160, 12345)  # only 12 bytes

        with pytest.raises(ValueError, match="too short for"):
            RtpPacket.parse(data)


class TestRtpPacketBuild:
    """Tests for RtpPacket.build()."""

    def test_build_minimal_packet(self):
        """Build a minimal packet and verify header bytes."""
        pkt = RtpPacket(
            version=2, padding=False, extension=False, csrc_count=0,
            marker=False, payload_type=96, sequence_number=1,
            timestamp=160, ssrc=12345, csrc_list=[], payload=b"",
        )
        raw = pkt.build()

        assert len(raw) == 12
        byte0, byte1, seq, ts, ssrc = struct.unpack("!BBHII", raw)
        assert (byte0 >> 6) == 2
        assert seq == 1
        assert ts == 160
        assert ssrc == 12345

    def test_build_with_payload(self):
        """Build includes payload after header."""
        payload = b"\xca\xfe\xba\xbe"
        pkt = RtpPacket(
            version=2, padding=False, extension=False, csrc_count=0,
            marker=False, payload_type=111, sequence_number=50,
            timestamp=9600, ssrc=42, csrc_list=[], payload=payload,
        )
        raw = pkt.build()

        assert raw[12:] == payload

    def test_build_with_csrc(self):
        """Build includes CSRC entries between header and payload."""
        pkt = RtpPacket(
            version=2, padding=False, extension=False, csrc_count=2,
            marker=False, payload_type=96, sequence_number=1,
            timestamp=160, ssrc=12345, csrc_list=[100, 200], payload=b"\x01",
        )
        raw = pkt.build()

        assert len(raw) == 12 + 8 + 1  # header + 2 CSRCs + 1 byte payload
        csrc1, csrc2 = struct.unpack("!II", raw[12:20])
        assert csrc1 == 100
        assert csrc2 == 200
        assert raw[20:] == b"\x01"


class TestRtpPacketRoundTrip:
    """Tests for parse/build round-trip."""

    def test_round_trip_minimal(self):
        """parse(build()) produces equal packet for minimal case."""
        original = RtpPacket(
            version=2, padding=False, extension=False, csrc_count=0,
            marker=False, payload_type=96, sequence_number=1,
            timestamp=160, ssrc=12345, csrc_list=[], payload=b"",
        )
        assert RtpPacket.parse(original.build()) == original

    def test_round_trip_full(self):
        """parse(build()) produces equal packet with all fields populated."""
        original = RtpPacket(
            version=2, padding=True, extension=True, csrc_count=3,
            marker=True, payload_type=111, sequence_number=65535,
            timestamp=0xFFFFFFFF, ssrc=0xFFFFFFFF,
            csrc_list=[1, 2, 3], payload=b"\xde\xad\xbe\xef" * 100,
        )
        assert RtpPacket.parse(original.build()) == original
