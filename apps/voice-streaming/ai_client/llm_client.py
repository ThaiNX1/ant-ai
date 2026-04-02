"""LLM client — calls ai-service LLM endpoints.

Provides:
  - generate(prompt, options) -> str: POST /llm/generate
  - generate_stream(prompt, options) -> AsyncIterator[str]: POST /llm/generate-stream (SSE)
"""

import json
import logging
from typing import Any, AsyncIterator, Dict, Optional

from .ai_service_client import AiServiceClient

logger = logging.getLogger(__name__)


class LlmClient(AiServiceClient):
    """HTTP client for ai-service LLM endpoints."""

    async def generate(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Send a prompt to POST /llm/generate and return the result text.

        Args:
            prompt: The text prompt to send.
            options: Optional generation options (temperature, max_tokens, etc.).

        Returns:
            The generated text string.
        """
        payload: Dict[str, Any] = {"prompt": prompt}
        if options:
            payload["options"] = options

        resp = await self.post("/llm/generate", json=payload)
        body = await resp.json()
        return body["result"]

    async def generate_stream(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[str]:
        """Stream LLM generation via POST /llm/generate-stream (SSE).

        Parses Server-Sent Events and yields each data payload as a string.

        Args:
            prompt: The text prompt to send.
            options: Optional generation options.

        Yields:
            Text chunks from the SSE stream.
        """
        payload: Dict[str, Any] = {"prompt": prompt}
        if options:
            payload["options"] = options

        resp = await self.post("/llm/generate-stream", json=payload)

        async for line in resp.content:
            decoded = line.decode("utf-8").strip()
            if not decoded:
                continue
            if decoded.startswith("data:"):
                data = decoded[len("data:"):].strip()
                if data == "[DONE]":
                    break
                yield data
