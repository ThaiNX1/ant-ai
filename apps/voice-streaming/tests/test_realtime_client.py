"""Unit tests for RealtimeClient."""

import json
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

import aiohttp
import pytest

from ai_client.realtime_client import RealtimeClient


@pytest.fixture
def client():
    return RealtimeClient(base_url="http://localhost:8081", timeout=10.0)


class TestRealtimeClientInit:
    """Test client initialization."""

    def test_strips_trailing_slash(self):
        c = RealtimeClient(base_url="http://host:8081/")
        assert c.base_url == "http://host:8081"

    def test_default_timeout(self):
        c = RealtimeClient(base_url="http://host:8081")
        assert c.timeout == 30.0

    def test_not_connected_initially(self, client):
        assert client.connected is False


class TestRealtimeClientConnect:
    """Test connect() method."""

    @pytest.mark.asyncio
    async def test_connect_opens_websocket(self, client):
        mock_ws = AsyncMock()
        mock_ws.closed = False

        mock_session = AsyncMock()
        mock_session.ws_connect = AsyncMock(return_value=mock_ws)

        with patch("ai_client.realtime_client.aiohttp.ClientSession", return_value=mock_session):
            await client.connect()

        mock_session.ws_connect.assert_called_once_with("ws://localhost:8081/realtime")
        assert client.connected is True

    @pytest.mark.asyncio
    async def test_connect_sends_session_config(self, client):
        mock_ws = AsyncMock()
        mock_ws.closed = False

        mock_session = AsyncMock()
        mock_session.ws_connect = AsyncMock(return_value=mock_ws)

        config = {"model": "gpt-4o-realtime", "voice": "alloy"}

        with patch("ai_client.realtime_client.aiohttp.ClientSession", return_value=mock_session):
            await client.connect(session_config=config)

        mock_ws.send_json.assert_called_once_with(config)

    @pytest.mark.asyncio
    async def test_connect_without_config_does_not_send(self, client):
        mock_ws = AsyncMock()
        mock_ws.closed = False

        mock_session = AsyncMock()
        mock_session.ws_connect = AsyncMock(return_value=mock_ws)

        with patch("ai_client.realtime_client.aiohttp.ClientSession", return_value=mock_session):
            await client.connect()

        mock_ws.send_json.assert_not_called()

    @pytest.mark.asyncio
    async def test_connect_converts_https_to_wss(self):
        c = RealtimeClient(base_url="https://ai-service.example.com")
        mock_ws = AsyncMock()
        mock_ws.closed = False

        mock_session = AsyncMock()
        mock_session.ws_connect = AsyncMock(return_value=mock_ws)

        with patch("ai_client.realtime_client.aiohttp.ClientSession", return_value=mock_session):
            await c.connect()

        mock_session.ws_connect.assert_called_once_with(
            "wss://ai-service.example.com/realtime"
        )


class TestRealtimeClientFeedAudio:
    """Test feed_audio() method."""

    @pytest.mark.asyncio
    async def test_feed_audio_sends_bytes(self, client):
        mock_ws = AsyncMock()
        mock_ws.closed = False
        client._ws = mock_ws

        audio = b"\x00\x01\x02\x03"
        await client.feed_audio(audio)

        mock_ws.send_bytes.assert_called_once_with(audio)

    @pytest.mark.asyncio
    async def test_feed_audio_raises_when_not_connected(self, client):
        with pytest.raises(RuntimeError, match="not connected"):
            await client.feed_audio(b"\x00")


class TestRealtimeClientGetResponseStream:
    """Test get_response_stream() method."""

    @pytest.mark.asyncio
    async def test_yields_parsed_json_messages(self, client):
        msg1 = MagicMock()
        msg1.type = aiohttp.WSMsgType.TEXT
        msg1.data = json.dumps({"type": "transcript", "text": "hello"})

        msg2 = MagicMock()
        msg2.type = aiohttp.WSMsgType.TEXT
        msg2.data = json.dumps({"type": "audio", "data": "base64..."})

        msg3 = MagicMock()
        msg3.type = aiohttp.WSMsgType.CLOSE

        messages = [msg1, msg2, msg3]

        class MockWs:
            closed = False

            def __aiter__(self):
                return self._iter()

            async def _iter(self):
                for m in messages:
                    yield m

        client._ws = MockWs()

        results = []
        async for resp in client.get_response_stream():
            results.append(resp)

        assert len(results) == 2
        assert results[0] == {"type": "transcript", "text": "hello"}
        assert results[1] == {"type": "audio", "data": "base64..."}

    @pytest.mark.asyncio
    async def test_stops_on_error_message(self, client):
        msg1 = MagicMock()
        msg1.type = aiohttp.WSMsgType.TEXT
        msg1.data = json.dumps({"type": "data"})

        msg_err = MagicMock()
        msg_err.type = aiohttp.WSMsgType.ERROR

        messages = [msg1, msg_err]

        class MockWs:
            closed = False

            def exception(self):
                return Exception("ws error")

            def __aiter__(self):
                return self._iter()

            async def _iter(self):
                for m in messages:
                    yield m

        client._ws = MockWs()

        results = []
        async for resp in client.get_response_stream():
            results.append(resp)

        assert len(results) == 1

    @pytest.mark.asyncio
    async def test_raises_when_not_connected(self, client):
        with pytest.raises(RuntimeError, match="not connected"):
            async for _ in client.get_response_stream():
                pass


class TestRealtimeClientDisconnect:
    """Test disconnect() method."""

    @pytest.mark.asyncio
    async def test_disconnect_closes_ws_and_session(self, client):
        mock_ws = AsyncMock()
        mock_ws.closed = False
        mock_session = AsyncMock()
        mock_session.closed = False

        client._ws = mock_ws
        client._session = mock_session

        await client.disconnect()

        mock_ws.close.assert_called_once()
        mock_session.close.assert_called_once()
        assert client._ws is None
        assert client._session is None

    @pytest.mark.asyncio
    async def test_disconnect_when_already_disconnected(self, client):
        # Should not raise
        await client.disconnect()
        assert client._ws is None
        assert client._session is None

    @pytest.mark.asyncio
    async def test_context_manager(self):
        mock_ws = AsyncMock()
        mock_ws.closed = False
        mock_session = AsyncMock()
        mock_session.closed = False

        async with RealtimeClient(base_url="http://localhost:8081") as c:
            c._ws = mock_ws
            c._session = mock_session

        mock_ws.close.assert_called_once()
        mock_session.close.assert_called_once()
