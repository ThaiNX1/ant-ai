"""Unit tests for the audio downsampler."""

import struct

from rtp_handler.downsampler import downsample_48k_to_16k


class TestDownsample48kTo16k:
    """Tests for downsample_48k_to_16k()."""

    def test_empty_input_returns_empty(self):
        assert downsample_48k_to_16k(b"") == b""

    def test_takes_every_3rd_sample(self):
        # 6 samples at 48kHz: [10, 20, 30, 40, 50, 60]
        # Expected at 16kHz: [10, 40] (indices 0, 3)
        samples = [10, 20, 30, 40, 50, 60]
        pcm_input = struct.pack(f"<{len(samples)}h", *samples)
        result = downsample_48k_to_16k(pcm_input)
        output_samples = struct.unpack(f"<{len(result) // 2}h", result)
        assert output_samples == (10, 40)

    def test_output_length_is_one_third(self):
        # 9 samples → 3 output samples → 6 bytes
        samples = list(range(9))
        pcm_input = struct.pack(f"<{len(samples)}h", *samples)
        result = downsample_48k_to_16k(pcm_input)
        assert len(result) == len(pcm_input) // 3

    def test_truncates_input_not_divisible_by_6(self):
        # 8 samples (16 bytes, not divisible by 6) → truncate to 6 samples (12 bytes)
        samples = [100, 200, 300, 400, 500, 600, 700, 800]
        pcm_input = struct.pack(f"<{len(samples)}h", *samples)
        result = downsample_48k_to_16k(pcm_input)
        output_samples = struct.unpack(f"<{len(result) // 2}h", result)
        assert output_samples == (100, 400)

    def test_input_too_short_for_one_group(self):
        # 2 samples (4 bytes) — not divisible by 6, truncates to 0
        pcm_input = struct.pack("<2h", 100, 200)
        assert downsample_48k_to_16k(pcm_input) == b""

    def test_single_byte_returns_empty(self):
        assert downsample_48k_to_16k(b"\x01") == b""

    def test_preserves_negative_samples(self):
        samples = [-1000, 0, 500, -2000, 100, -300]
        pcm_input = struct.pack(f"<{len(samples)}h", *samples)
        result = downsample_48k_to_16k(pcm_input)
        output_samples = struct.unpack(f"<{len(result) // 2}h", result)
        assert output_samples == (-1000, -2000)

    def test_min_max_int16_values(self):
        samples = [-32768, 0, 32767, 32767, 0, -32768]
        pcm_input = struct.pack(f"<{len(samples)}h", *samples)
        result = downsample_48k_to_16k(pcm_input)
        output_samples = struct.unpack(f"<{len(result) // 2}h", result)
        assert output_samples == (-32768, 32767)
