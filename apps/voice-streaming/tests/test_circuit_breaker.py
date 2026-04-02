"""Unit tests for CircuitBreaker."""

import pytest

from ai_client.circuit_breaker import CircuitBreaker, CircuitBreakerOpen, CircuitState


class TestCircuitBreakerStates:
    """Test circuit breaker state transitions."""

    def test_initial_state_is_closed(self):
        cb = CircuitBreaker()
        assert cb.state == CircuitState.CLOSED

    def test_stays_closed_below_threshold(self):
        cb = CircuitBreaker(failure_threshold=5)
        for _ in range(4):
            cb.record_failure()
        assert cb.state == CircuitState.CLOSED

    def test_opens_at_failure_threshold(self):
        cb = CircuitBreaker(failure_threshold=5)
        for _ in range(5):
            cb.record_failure()
        assert cb.state == CircuitState.OPEN

    def test_success_resets_failure_count(self):
        cb = CircuitBreaker(failure_threshold=5)
        for _ in range(4):
            cb.record_failure()
        cb.record_success()
        assert cb.failure_count == 0
        assert cb.state == CircuitState.CLOSED

    def test_transitions_to_half_open_after_recovery_timeout(self):
        current_time = 0.0

        def clock():
            return current_time

        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=30.0, clock=clock)
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN

        # Advance time past recovery timeout
        current_time = 31.0
        assert cb.state == CircuitState.HALF_OPEN

    def test_half_open_success_closes_circuit(self):
        current_time = 0.0

        def clock():
            return current_time

        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=10.0, clock=clock)
        cb.record_failure()
        cb.record_failure()

        current_time = 11.0
        assert cb.state == CircuitState.HALF_OPEN

        cb.record_success()
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0

    def test_half_open_failure_reopens_circuit(self):
        current_time = 0.0

        def clock():
            return current_time

        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=10.0, clock=clock)
        cb.record_failure()
        cb.record_failure()

        current_time = 11.0
        assert cb.state == CircuitState.HALF_OPEN

        cb.record_failure()
        assert cb.state == CircuitState.OPEN


class TestCircuitBreakerAllowRequest:
    """Test allow_request and check methods."""

    def test_allows_when_closed(self):
        cb = CircuitBreaker()
        assert cb.allow_request() is True

    def test_rejects_when_open(self):
        cb = CircuitBreaker(failure_threshold=1)
        cb.record_failure()
        assert cb.allow_request() is False

    def test_allows_when_half_open(self):
        current_time = 0.0

        def clock():
            return current_time

        cb = CircuitBreaker(failure_threshold=1, recovery_timeout=5.0, clock=clock)
        cb.record_failure()
        current_time = 6.0
        assert cb.allow_request() is True

    def test_check_raises_when_open(self):
        cb = CircuitBreaker(failure_threshold=1)
        cb.record_failure()
        with pytest.raises(CircuitBreakerOpen):
            cb.check()

    def test_check_passes_when_closed(self):
        cb = CircuitBreaker()
        cb.check()  # should not raise
