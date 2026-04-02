"""Unit tests for TtsService."""

from unittest.mock import MagicMock

import pytest

from services.tts_service import TtsService


def _make_tts_client():
    """Create a mock TtsClient."""
    client = MagicMock()
    client.stream_synthesize = MagicMock()
    return client


class TestTtsServiceSynthesizeSpeech:
    """Test TtsService.synthesize_speech()."""

    @pytest.mark.asyncio
    async def test_yields_audio_chunks(self):
        client = _make_tts_client()

        async def _mock_stream(text, voice_id=None, options=None):
            yield b"\x00\x01\x02"
            yield b"\x03\x04\x05"

        client.stream_synthesize = _mock_stream
        service = TtsService(client)

        chunks = []
        async for chunk in service.synthesize_speech("Hello"):
            chunks.append(chunk)

        assert chunks == [b"\x00\x01\x02", b"\x03\x04\x05"]

    @pytest.mark.asyncio
    async def test_passes_voice_id_and_options(self):
        client = _make_tts_client()
        call_log = {}

        async def _mock_stream(text, voice_id=None, options=None):
            call_log["text"] = text
            call_log["voice_id"] = voice_id
            call_log["options"] = options
            yield b"\x00"

        client.stream_synthesize = _mock_stream
        service = TtsService(client)

        async for _ in service.synthesize_speech(
            "Hi", voice_id="voice-1", options={"speed": 1.2}
        ):
            pass

        assert call_log["text"] == "Hi"
        assert call_log["voice_id"] == "voice-1"
        assert call_log["options"] == {"speed": 1.2}


class TestTtsServiceSynthesizeToBuffer:
    """Test TtsService.synthesize_to_buffer()."""

    @pytest.mark.asyncio
    async def test_collects_all_chunks(self):
        client = _make_tts_client()

        async def _mock_stream(text, voice_id=None, options=None):
            yield b"chunk1"
            yield b"chunk2"
            yield b"chunk3"

        client.stream_synthesize = _mock_stream
        service = TtsService(client)

        result = await service.synthesize_to_buffer("Hello world")
        assert result == b"chunk1chunk2chunk3"

    @pytest.mark.asyncio
    async def test_empty_synthesis(self):
        client = _make_tts_client()

        async def _mock_stream(text, voice_id=None, options=None):
            return
            yield  # make it an async generator

        client.stream_synthesize = _mock_stream
        service = TtsService(client)

        result = await service.synthesize_to_buffer("")
        assert result == b""
