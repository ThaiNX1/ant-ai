"""Base async HTTP client for ai-service with retry and circuit breaker.

Uses aiohttp.ClientSession under the hood. Provides:
  - Configurable base_url and timeout
  - Retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
  - Circuit breaker integration
"""

import asyncio
import logging
from typing import Any, Dict, Optional

import aiohttp

from .circuit_breaker import CircuitBreaker, CircuitBreakerOpen

logger = logging.getLogger(__name__)

RETRY_DELAYS = [1, 2, 4, 8, 16]


class AiServiceClient:
    """Base HTTP client with retry (exponential backoff) and circuit breaker."""

    def __init__(
        self,
        base_url: str,
        timeout: float = 10.0,
        circuit_breaker: Optional[CircuitBreaker] = None,
        retry_delays: Optional[list] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.circuit_breaker = circuit_breaker or CircuitBreaker(
            failure_threshold=5, recovery_timeout=30.0
        )
        self.retry_delays = retry_delays if retry_delays is not None else list(RETRY_DELAYS)
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            )
        return self._session

    async def close(self) -> None:
        """Close the underlying aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    async def request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> aiohttp.ClientResponse:
        """Execute an HTTP request with retry + circuit breaker.

        Raises:
            CircuitBreakerOpen: if the circuit breaker is open.
            aiohttp.ClientError: after all retries are exhausted.
        """
        url = f"{self.base_url}/{path.lstrip('/')}"
        last_exc: Optional[Exception] = None

        for attempt, delay in enumerate(
            [0] + self.retry_delays  # first attempt has no delay
        ):
            if attempt > 0:
                await asyncio.sleep(delay)

            # Check circuit breaker before each attempt
            self.circuit_breaker.check()

            try:
                session = await self._get_session()
                resp = await session.request(method, url, **kwargs)
                resp.raise_for_status()
                self.circuit_breaker.record_success()
                return resp
            except CircuitBreakerOpen:
                raise
            except Exception as exc:
                last_exc = exc
                self.circuit_breaker.record_failure()
                logger.warning(
                    "Request %s %s attempt %d failed: %s",
                    method,
                    url,
                    attempt + 1,
                    exc,
                )

        # All retries exhausted
        raise last_exc  # type: ignore[misc]

    async def get(self, path: str, **kwargs: Any) -> aiohttp.ClientResponse:
        return await self.request("GET", path, **kwargs)

    async def post(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> aiohttp.ClientResponse:
        return await self.request("POST", path, json=json, **kwargs)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        await self.close()
