"""Opus codec wrapper for encoding/decoding VoIP audio."""

import logging

import opuslib

logger = logging.getLogger(__name__)


class OpusCodec:
    """Wraps opuslib Encoder and Decoder for 16kHz mono VoIP audio.

    RTP spec: 16 kHz sample rate, 20 ms frames, 320 samples/frame.
    """

    SAMPLE_RATE = 16000
    CHANNELS = 1
    APPLICATION = opuslib.APPLICATION_VOIP
    FRAME_SIZE = 320  # 16kHz × 20ms = 320 samples

    def __init__(self) -> None:
        self._encoder = opuslib.Encoder(self.SAMPLE_RATE, self.CHANNELS, self.APPLICATION)
        self._decoder = opuslib.Decoder(self.SAMPLE_RATE, self.CHANNELS)

    def decode(self, opus_data: bytes, frame_size: int = 320) -> bytes:
        """Decode Opus bytes to raw PCM (16-bit, 16kHz, mono).

        Args:
            opus_data: Opus-encoded audio bytes.
            frame_size: Number of samples per frame. Default 320 (20ms at 16kHz).

        Returns:
            PCM bytes on success, empty bytes on failure.
        """
        try:
            return self._decoder.decode(opus_data, frame_size)
        except opuslib.OpusError as exc:
            logger.warning("Opus decode failed: %s", exc)
            return b""

    def encode(self, pcm_data: bytes, frame_size: int = 320) -> bytes:
        """Encode raw PCM bytes to Opus.

        Args:
            pcm_data: Raw 16-bit PCM audio bytes (16kHz mono).
            frame_size: Number of samples per frame. Default 320 (20ms at 16kHz).

        Returns:
            Opus-encoded bytes.
        """
        return self._encoder.encode(pcm_data, frame_size)
