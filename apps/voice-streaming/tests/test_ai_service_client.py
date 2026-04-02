"""Unit tests for AiServiceClient — retry and circuit breaker integration."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from ai_client.ai_service_client import AiServiceClient, RETRY_DELAYS
from ai_client.circuit_breaker import CircuitBreaker, CircuitBreakerOpen, CircuitState


@pytest.fixture
def circuit_breaker():
    return CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)


@pytest.fixture
def client(circuit_breaker):
    return AiServiceClient(
        base_url="http://localhost:8081",
        timeout=5.0,
        circuit_breaker=circuit_breaker,
        retry_delays=[0, 0, 0, 0, 0],  # zero delays for fast tests
    )


class TestAiServiceClientInit:
    """Test client initialization."""

    def test_strips_trailing_slash_from_base_url(self):
        c = AiServiceClient(base_url="http://host:8081/")
        assert c.base_url == "http://host:8081"

    def test_default_circuit_breaker_created(self):
        c = AiServiceClient(base_url="http://host:8081")
        assert isinstance(c.circuit_breaker, CircuitBreaker)
        assert c.circuit_breaker.failure_threshold == 5

    def test_default_retry_delays(self):
        c = AiServiceClient(base_url="http://host:8081")
        assert c.retry_delays == [1, 2, 4, 8, 16]

    def test_custom_timeout(self):
        c = AiServiceClient(base_url="http://host:8081", timeout=20.0)
        assert c.timeout == 20.0


class TestAiServiceClientRequest:
    """Test request method with retry and circuit breaker."""

    @pytest.mark.asyncio
    async def test_successful_request(self, client):
        mock_resp = AsyncMock()
        mock_resp.raise_for_status = MagicMock()

        mock_session = AsyncMock()
        mock_session.request = AsyncMock(return_value=mock_resp)
        mock_session.closed = False

        client._session = mock_session

        resp = await client.request("GET", "/health")
        assert resp is mock_resp
        mock_resp.raise_for_status.assert_called_once()

    @pytest.mark.asyncio
    async def test_retries_on_failure_then_succeeds(self, client):
        mock_resp = AsyncMock()
        mock_resp.raise_for_status = MagicMock()

        mock_session = AsyncMock()
        mock_session.closed = False
        # Fail twice, then succeed
        mock_session.request = AsyncMock(
            side_effect=[
                Exception("connection error"),
                Exception("timeout"),
                mock_resp,
            ]
        )
        client._session = mock_session

        resp = await client.request("GET", "/health")
        assert resp is mock_resp
        assert mock_session.request.call_count == 3

    @pytest.mark.asyncio
    async def test_raises_after_all_retries_exhausted(self, client):
        """When all retries fail, the circuit breaker opens and rejects further attempts."""
        mock_session = AsyncMock()
        mock_session.closed = False
        mock_session.request = AsyncMock(side_effect=Exception("always fails"))
        client._session = mock_session

        # With threshold=5 and 6 total attempts (1 initial + 5 retries),
        # the circuit breaker opens after the 5th failure and the 6th attempt
        # is rejected by the circuit breaker.
        with pytest.raises((Exception, CircuitBreakerOpen)):
            await client.request("GET", "/health")

        # At least 5 actual HTTP attempts before circuit breaker trips
        assert mock_session.request.call_count >= 5

    @pytest.mark.asyncio
    async def test_circuit_breaker_opens_after_threshold(self, client):
        mock_session = AsyncMock()
        mock_session.closed = False
        mock_session.request = AsyncMock(side_effect=Exception("fail"))
        client._session = mock_session

        # Exhaust retries — this records 6 failures (> threshold of 5)
        with pytest.raises(Exception):
            await client.request("GET", "/health")

        assert client.circuit_breaker.state == CircuitState.OPEN

        # Next request should be rejected immediately by circuit breaker
        with pytest.raises(CircuitBreakerOpen):
            await client.request("GET", "/health")

    @pytest.mark.asyncio
    async def test_records_success_on_circuit_breaker(self, client):
        mock_resp = AsyncMock()
        mock_resp.raise_for_status = MagicMock()

        mock_session = AsyncMock()
        mock_session.closed = False
        mock_session.request = AsyncMock(return_value=mock_resp)
        client._session = mock_session

        await client.request("GET", "/health")
        assert client.circuit_breaker.failure_count == 0
        assert client.circuit_breaker.state == CircuitState.CLOSED


class TestAiServiceClientHelpers:
    """Test convenience methods and context manager."""

    @pytest.mark.asyncio
    async def test_get_method(self, client):
        mock_resp = AsyncMock()
        mock_resp.raise_for_status = MagicMock()

        mock_session = AsyncMock()
        mock_session.closed = False
        mock_session.request = AsyncMock(return_value=mock_resp)
        client._session = mock_session

        resp = await client.get("/health")
        assert resp is mock_resp
        mock_session.request.assert_called_once()
        call_args = mock_session.request.call_args
        assert call_args[0][0] == "GET"

    @pytest.mark.asyncio
    async def test_post_method(self, client):
        mock_resp = AsyncMock()
        mock_resp.raise_for_status = MagicMock()

        mock_session = AsyncMock()
        mock_session.closed = False
        mock_session.request = AsyncMock(return_value=mock_resp)
        client._session = mock_session

        resp = await client.post("/llm/generate", json={"prompt": "hello"})
        assert resp is mock_resp

    @pytest.mark.asyncio
    async def test_close_session(self, client):
        mock_session = AsyncMock()
        mock_session.closed = False
        client._session = mock_session

        await client.close()
        mock_session.close.assert_called_once()
        assert client._session is None

    @pytest.mark.asyncio
    async def test_context_manager(self):
        async with AiServiceClient(
            base_url="http://localhost:8081",
            retry_delays=[0],
        ) as client:
            assert isinstance(client, AiServiceClient)
