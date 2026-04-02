"""Unit tests for TtsClient."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from ai_client.tts_client import TtsClient, DEFAULT_CHUNK_SIZE
from ai_client.circuit_breaker import CircuitBreaker


@pytest.fixture
def client():
    return TtsClient(
        base_url="http://localhost:8081",
        timeout=5.0,
        circuit_breaker=CircuitBreaker(failure_threshold=5, recovery_timeout=30.0),
        retry_delays=[0],
    )


def _make_mock_session(audio_chunks=None):
    """Create a mock aiohttp session returning chunked audio."""
    mock_resp = AsyncMock()
    mock_resp.raise_for_status = MagicMock()

    if audio_chunks is not None:
        async def _iter_chunked(size):
            for chunk in audio_chunks:
                yield chunk

        mock_resp.content = MagicMock()
        mock_resp.content.iter_chunked = _iter_chunked

    mock_session = AsyncMock()
    mock_session.closed = False
    mock_session.request = AsyncMock(return_value=mock_resp)
    return mock_session


class TestTtsClientStreamSynthesize:
    """Test TtsClient.stream_synthesize()."""

    @pytest.mark.asyncio
    async def test_yields_audio_chunks(self, client):
        audio_data = [b"\x00\x01\x02", b"\x03\x04\x05", b"\x06\x07"]
        mock_session = _make_mock_session(audio_chunks=audio_data)
        client._session = mock_session

        chunks = []
        async for chunk in client.stream_synthesize("Hello world"):
            chunks.append(chunk)

        assert chunks == audio_data

    @pytest.mark.asyncio
    async def test_sends_correct_payload_with_text_only(self, client):
        mock_session = _make_mock_session(audio_chunks=[])
        client._session = mock_session

        async for _ in client.stream_synthesize("Hello"):
            pass

        call_args = mock_session.request.call_args
        assert call_args[1]["json"] == {"text": "Hello"}

    @pytest.mark.asyncio
    async def test_sends_voice_id_when_provided(self, client):
        mock_session = _make_mock_session(audio_chunks=[])
        client._session = mock_session

        async for _ in client.stream_synthesize("Hello", voice_id="voice-1"):
            pass

        call_args = mock_session.request.call_args
        assert call_args[1]["json"] == {"text": "Hello", "voiceId": "voice-1"}

    @pytest.mark.asyncio
    async def test_sends_options_when_provided(self, client):
        mock_session = _make_mock_session(audio_chunks=[])
        client._session = mock_session

        async for _ in client.stream_synthesize(
            "Hello", options={"speed": 1.2, "format": "mp3"}
        ):
            pass

        call_args = mock_session.request.call_args
        assert call_args[1]["json"] == {
            "text": "Hello",
            "options": {"speed": 1.2, "format": "mp3"},
        }

    @pytest.mark.asyncio
    async def test_skips_empty_chunks(self, client):
        audio_data = [b"\x00\x01", b"", b"\x02\x03"]
        mock_session = _make_mock_session(audio_chunks=audio_data)
        client._session = mock_session

        chunks = []
        async for chunk in client.stream_synthesize("Hello"):
            chunks.append(chunk)

        # Empty bytes b"" is falsy, so it should be skipped
        assert chunks == [b"\x00\x01", b"\x02\x03"]
