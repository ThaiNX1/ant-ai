"""Circuit breaker pattern implementation.

States:
  CLOSED  — normal operation, requests pass through
  OPEN    — reject immediately, no HTTP calls
  HALF_OPEN — allow one test request; success → CLOSED, failure → OPEN

Config:
  failure_threshold: consecutive failures before opening (default 5)
  recovery_timeout: seconds before transitioning OPEN → HALF_OPEN (default 30)
"""

import asyncio
import enum
import time


class CircuitState(enum.Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreakerOpen(Exception):
    """Raised when the circuit breaker is open and rejects a request."""

    def __init__(self, recovery_remaining: float = 0.0):
        self.recovery_remaining = recovery_remaining
        super().__init__(
            f"Circuit breaker is OPEN. Recovery in {recovery_remaining:.1f}s"
        )


class CircuitBreaker:
    """Circuit breaker that tracks consecutive failures and short-circuits requests."""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        clock=None,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._clock = clock or time.monotonic
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: float = 0.0

    @property
    def state(self) -> CircuitState:
        if self._state == CircuitState.OPEN:
            elapsed = self._clock() - self._last_failure_time
            if elapsed >= self.recovery_timeout:
                self._state = CircuitState.HALF_OPEN
        return self._state

    @property
    def failure_count(self) -> int:
        return self._failure_count

    def allow_request(self) -> bool:
        """Return True if a request is allowed through the breaker."""
        current = self.state
        if current == CircuitState.CLOSED:
            return True
        if current == CircuitState.HALF_OPEN:
            return True
        return False

    def record_success(self) -> None:
        """Record a successful request — resets the breaker to CLOSED."""
        self._failure_count = 0
        self._state = CircuitState.CLOSED

    def record_failure(self) -> None:
        """Record a failed request — may trip the breaker to OPEN."""
        self._failure_count += 1
        self._last_failure_time = self._clock()
        if self._failure_count >= self.failure_threshold:
            self._state = CircuitState.OPEN

    def check(self) -> None:
        """Raise CircuitBreakerOpen if the breaker does not allow requests."""
        if not self.allow_request():
            remaining = self.recovery_timeout - (
                self._clock() - self._last_failure_time
            )
            raise CircuitBreakerOpen(recovery_remaining=max(0.0, remaining))
