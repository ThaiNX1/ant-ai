"""Webhook route setup for the voice-streaming control server."""

from __future__ import annotations

from aiohttp import web

from core.session_manager import SessionManager
from webhook.webhook_auth import webhook_auth_middleware
from webhook.webhook_handlers import deregister_ssrc, register_ssrc


def setup_webhook_routes(app: web.Application, session_manager: SessionManager) -> None:
    """Register webhook routes with auth middleware on the aiohttp app."""
    app["session_manager"] = session_manager

    webhook_app = web.Application(middlewares=[webhook_auth_middleware])
    webhook_app["session_manager"] = session_manager
    webhook_app["webhook_secret"] = app["webhook_secret"]

    # Propagate STT config and orchestrator reference to webhook sub-app
    for key in ("stt_enabled", "stt_provider", "ai_service_url", "ai_service_timeout", "orchestrator"):
        if key in app:
            webhook_app[key] = app[key]

    webhook_app.router.add_post("/register-ssrc", register_ssrc)
    webhook_app.router.add_post("/deregister-ssrc", deregister_ssrc)

    app.add_subapp("/webhook", webhook_app)
