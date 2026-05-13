"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class AppConfig:
    """Central configuration for the voice-streaming application."""

    webhook_secret: str
    session_idle_timeout: int = 60
    rtp_port: int = 5004
    control_port: int = 7000
    ai_service_url: str = "http://localhost:8081"
    ai_service_timeout: float = 10.0
    stt_provider: str = "deepgram"
    stt_enabled: bool = True

    @classmethod
    def from_env(cls) -> AppConfig:
        """Load configuration from environment variables.

        Raises:
            ValueError: If WEBHOOK_SECRET is not set.
        """
        webhook_secret = os.environ.get("WEBHOOK_SECRET")
        if not webhook_secret:
            raise ValueError(
                "WEBHOOK_SECRET environment variable is required but not set"
            )

        return cls(
            webhook_secret=webhook_secret,
            session_idle_timeout=int(
                os.environ.get("SESSION_IDLE_TIMEOUT", "60")
            ),
            rtp_port=int(os.environ.get("RTP_PORT", "5004")),
            control_port=int(os.environ.get("CONTROL_PORT", "7000")),
            ai_service_url=os.environ.get(
                "AI_SERVICE_URL", "http://localhost:8081"
            ),
            ai_service_timeout=float(
                os.environ.get("AI_SERVICE_TIMEOUT", "10.0")
            ),
            stt_provider=os.environ.get("STT_PROVIDER", "deepgram"),
            stt_enabled=os.environ.get("STT_ENABLED", "true").lower()
            in ("true", "1", "yes"),
        )
