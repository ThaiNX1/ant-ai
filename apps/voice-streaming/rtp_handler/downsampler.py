"""Audio downsampler for converting 48kHz PCM to 16kHz PCM."""

import struct


def downsample_48k_to_16k(pcm_48k: bytes) -> bytes:
    """Downsample 48kHz 16-bit mono PCM to 16kHz by taking every 3rd sample.

    Args:
        pcm_48k: Raw PCM bytes (16-bit signed, little-endian, 48kHz mono).

    Returns:
        Downsampled PCM bytes at 16kHz.
    """
    if not pcm_48k:
        return b""

    # Truncate to nearest valid length (divisible by 6: 3 samples × 2 bytes/sample)
    valid_len = len(pcm_48k) - (len(pcm_48k) % 6)
    if valid_len == 0:
        return b""

    pcm_48k = pcm_48k[:valid_len]

    # Read all samples as int16 little-endian
    num_samples = valid_len // 2
    samples = struct.unpack(f"<{num_samples}h", pcm_48k)

    # Take every 3rd sample (index 0, 3, 6, ...)
    downsampled = samples[::3]

    # Pack back to bytes
    return struct.pack(f"<{len(downsampled)}h", *downsampled)
