"""RTP handler module — UDP, Opus, packet parsing.

Import directly from submodules to avoid triggering the full import chain
(opus_codec requires the native libopus C library):
    from rtp_handler.rtp_packet import RtpPacket
    from rtp_handler.opus_codec import OpusCodec
    from rtp_handler.udp_server import RtpUdpProtocol
"""
