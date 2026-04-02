"""Unit tests for LlmClient."""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from ai_client.llm_client import LlmClient
from ai_client.circuit_breaker import CircuitBreaker


@pytest.fixture
def client():
    return LlmClient(
        base_url="http://localhost:8081",
        timeout=5.0,
        circuit_breaker=CircuitBreaker(failure_threshold=5, recovery_timeout=30.0),
        retry_delays=[0],
    )


def _make_mock_session(response_json=None, response_lines=None):
    """Create a mock aiohttp session with a configurable response."""
    mock_resp = AsyncMock()
    mock_resp.raise_for_status = MagicMock()

    if response_json is not None:
        mock_resp.json = AsyncMock(return_value=response_json)

    if response_lines is not None:
        # Simulate async line iteration for SSE
        async def _content_iter():
            for line in response_lines:
                yield line

        mock_resp.content = _content_iter()

    mock_session = AsyncMock()
    mock_session.closed = False
    mock_session.request = AsyncMock(return_value=mock_resp)
    return mock_session


class TestLlmClientGenerate:
    """Test LlmClient.generate()."""

    @pytest.mark.asyncio
    async def test_generate_returns_result(self, client):
        mock_session = _make_mock_session(response_json={"result": "Hello world"})
        client._session = mock_session

        result = await client.generate("Say hello")
        assert result == "Hello world"

    @pytest.mark.asyncio
    async def test_generate_sends_correct_payload(self, client):
        mock_session = _make_mock_session(response_json={"result": "ok"})
        client._session = mock_session

        await client.generate("test prompt", options={"temperature": 0.7})

        call_args = mock_session.request.call_args
        assert call_args[1]["json"] == {
            "prompt": "test prompt",
            "options": {"temperature": 0.7},
        }

    @pytest.mark.asyncio
    async def test_generate_without_options(self, client):
        mock_session = _make_mock_session(response_json={"result": "ok"})
        client._session = mock_session

        await client.generate("test prompt")

        call_args = mock_session.request.call_args
        assert call_args[1]["json"] == {"prompt": "test prompt"}


class TestLlmClientGenerateStream:
    """Test LlmClient.generate_stream()."""

    @pytest.mark.asyncio
    async def test_generate_stream_yields_data_chunks(self, client):
        sse_lines = [
            b"data: Hello\n",
            b"\n",
            b"data: World\n",
            b"\n",
            b"data: [DONE]\n",
        ]
        mock_session = _make_mock_session(response_lines=sse_lines)
        client._session = mock_session

        chunks = []
        async for chunk in client.generate_stream("Say hello"):
            chunks.append(chunk)

        assert chunks == ["Hello", "World"]

    @pytest.mark.asyncio
    async def test_generate_stream_skips_empty_lines(self, client):
        sse_lines = [
            b"\n",
            b"data: chunk1\n",
            b"\n",
            b"\n",
            b"data: chunk2\n",
            b"data: [DONE]\n",
        ]
        mock_session = _make_mock_session(response_lines=sse_lines)
        client._session = mock_session

        chunks = []
        async for chunk in client.generate_stream("prompt"):
            chunks.append(chunk)

        assert chunks == ["chunk1", "chunk2"]

    @pytest.mark.asyncio
    async def test_generate_stream_sends_options(self, client):
        sse_lines = [b"data: [DONE]\n"]
        mock_session = _make_mock_session(response_lines=sse_lines)
        client._session = mock_session

        chunks = []
        async for chunk in client.generate_stream("p", options={"max_tokens": 100}):
            chunks.append(chunk)

        call_args = mock_session.request.call_args
        assert call_args[1]["json"] == {
            "prompt": "p",
            "options": {"max_tokens": 100},
        }

    @pytest.mark.asyncio
    async def test_generate_stream_handles_no_done_marker(self, client):
        """Stream ends naturally when content is exhausted."""
        sse_lines = [
            b"data: only-chunk\n",
        ]
        mock_session = _make_mock_session(response_lines=sse_lines)
        client._session = mock_session

        chunks = []
        async for chunk in client.generate_stream("prompt"):
            chunks.append(chunk)

        assert chunks == ["only-chunk"]
