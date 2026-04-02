"""Unit tests for RealtimeService."""

from unittest.mock import AsyncMock, MagicMock, PropertyMock

import pytest

from services.realtime_service import RealtimeService


def _make_realtime_client(connected=False):
    """Create a mock RealtimeClient."""
    client = MagicMock()
    type(client).connected = PropertyMock(return_value=connected)
    client.connect = AsyncMock()
    client.feed_audio = AsyncMock()
    client.disconnect = AsyncMock()
    client.get_response_stream = MagicMock()
    return client


class TestRealtimeServiceStartSession:
    """Test RealtimeService.start_session()."""

    @pytest.mark.asyncio
    async def test_connects_with_config(self):
        client = _make_realtime_client()
        service = RealtimeService(client)

        config = {"model": "gpt-4o-realtime", "voice": "alloy"}
        await service.start_session(session_config=config)

        client.connect.assert_called_once_with(session_config=config)

    @pytest.mark.asyncio
    async def test_connects_without_config(self):
        client = _make_realtime_client()
        service = RealtimeService(client)

        await service.start_session()
        client.connect.assert_called_once_with(session_config=None)


class TestRealtimeServiceSendAudio:
    """Test RealtimeService.send_audio()."""

    @pytest.mark.asyncio
    async def test_feeds_audio_to_client(self):
        client = _make_realtime_client(connected=True)
        service = RealtimeService(client)

        audio = b"\x00\x01\x02\x03"
        await service.send_audio(audio)

        client.feed_audio.assert_called_once_with(audio)


class TestRealtimeServiceReceiveResponses:
    """Test RealtimeService.receive_responses()."""

    @pytest.mark.asyncio
    async def test_yields_responses_from_client(self):
        client = _make_realtime_client(connected=True)

        async def _mock_stream():
            yield {"type": "transcript", "text": "Hello"}
            yield {"type": "audio", "data": "base64..."}

        client.get_response_stream = _mock_stream
        service = RealtimeService(client)

        responses = []
        async for resp in service.receive_responses():
            responses.append(resp)

        assert len(responses) == 2
        assert responses[0] == {"type": "transcript", "text": "Hello"}
        assert responses[1] == {"type": "audio", "data": "base64..."}


class TestRealtimeServiceEndSession:
    """Test RealtimeService.end_session()."""

    @pytest.mark.asyncio
    async def test_disconnects_client(self):
        client = _make_realtime_client(connected=True)
        service = RealtimeService(client)

        await service.end_session()
        client.disconnect.assert_called_once()


class TestRealtimeServiceConnectedProperty:
    """Test RealtimeService.connected property."""

    def test_returns_client_connected_state(self):
        client = _make_realtime_client(connected=True)
        service = RealtimeService(client)
        assert service.connected is True

    def test_returns_false_when_disconnected(self):
        client = _make_realtime_client(connected=False)
        service = RealtimeService(client)
        assert service.connected is False


class TestRealtimeServiceContextManager:
    """Test RealtimeService async context manager."""

    @pytest.mark.asyncio
    async def test_context_manager_disconnects_on_exit(self):
        client = _make_realtime_client(connected=True)
        service = RealtimeService(client)

        async with service:
            pass

        client.disconnect.assert_called_once()
