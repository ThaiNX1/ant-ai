"""Webhook authentication middleware for aiohttp."""

from __future__ import annotations

import hmac
from typing import Callable

from aiohttp import web


@web.middleware
async def webhook_auth_middleware(
    request: web.Request,
    handler: Callable,
) -> web.Response:
    """aiohttp middleware that validates x-webhook-secret header.

    Compares the header value against the configured webhook secret
    using ``hmac.compare_digest`` for timing-safe comparison.

    Returns HTTP 401 if the header is missing or does not match.
    """
    secret = request.headers.get("x-webhook-secret")
    expected = request.app["webhook_secret"]

    if secret is None or not hmac.compare_digest(secret, expected):
        return web.json_response(
            {"status": "error", "reason": "unauthorized webhook request"},
            status=401,
        )

    return await handler(request)
