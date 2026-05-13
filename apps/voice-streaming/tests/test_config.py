"""Unit tests for AppConfig."""

import os

import pytest

from core.config import AppConfig


class TestAppConfigFromEnv:
    """Tests for AppConfig.from_env() classmethod."""

    def test_missing_webhook_secret_raises_value_error(self, monkeypatch):
        monkeypatch.delenv("WEBHOOK_SECRET", raising=False)
        with pytest.raises(ValueError, match="WEBHOOK_SECRET"):
            AppConfig.from_env()

    def test_empty_webhook_secret_raises_value_error(self, monkeypatch):
        monkeypatch.setenv("WEBHOOK_SECRET", "")
        with pytest.raises(ValueError, match="WEBHOOK_SECRET"):
            AppConfig.from_env()

    def test_defaults_applied_when_only_secret_set(self, monkeypatch):
        monkeypatch.setenv("WEBHOOK_SECRET", "test-secret")
        for var in (
            "SESSION_IDLE_TIMEOUT",
            "RTP_PORT",
            "CONTROL_PORT",
            "AI_SERVICE_URL",
            "AI_SERVICE_TIMEOUT",
            "STT_PROVIDER",
            "STT_ENABLED",
        ):
            monkeypatch.delenv(var, raising=False)

        config = AppConfig.from_env()

        assert config.webhook_secret == "test-secret"
        assert config.session_idle_timeout == 60
        assert config.rtp_port == 5004
        assert config.control_port == 7000
        assert config.ai_service_url == "http://localhost:8081"
        assert config.ai_service_timeout == 10.0
        assert config.stt_provider == "deepgram"
        assert config.stt_enabled is True

    def test_env_overrides(self, monkeypatch):
        monkeypatch.setenv("WEBHOOK_SECRET", "my-secret")
        monkeypatch.setenv("SESSION_IDLE_TIMEOUT", "120")
        monkeypatch.setenv("RTP_PORT", "6000")
        monkeypatch.setenv("CONTROL_PORT", "8000")
        monkeypatch.setenv("AI_SERVICE_URL", "http://ai:9090")
        monkeypatch.setenv("AI_SERVICE_TIMEOUT", "5.5")
        monkeypatch.setenv("STT_PROVIDER", "whisper")
        monkeypatch.setenv("STT_ENABLED", "false")

        config = AppConfig.from_env()

        assert config.webhook_secret == "my-secret"
        assert config.session_idle_timeout == 120
        assert config.rtp_port == 6000
        assert config.control_port == 8000
        assert config.ai_service_url == "http://ai:9090"
        assert config.ai_service_timeout == 5.5
        assert config.stt_provider == "whisper"
        assert config.stt_enabled is False

    def test_stt_enabled_truthy_values(self, monkeypatch):
        monkeypatch.setenv("WEBHOOK_SECRET", "test-secret")
        for val in ("true", "True", "TRUE", "1", "yes", "Yes"):
            monkeypatch.setenv("STT_ENABLED", val)
            config = AppConfig.from_env()
            assert config.stt_enabled is True, f"Expected True for STT_ENABLED={val!r}"

    def test_stt_enabled_falsy_values(self, monkeypatch):
        monkeypatch.setenv("WEBHOOK_SECRET", "test-secret")
        for val in ("false", "0", "no", "anything"):
            monkeypatch.setenv("STT_ENABLED", val)
            config = AppConfig.from_env()
            assert config.stt_enabled is False, f"Expected False for STT_ENABLED={val!r}"
