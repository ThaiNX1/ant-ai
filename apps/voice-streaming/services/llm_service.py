"""LLM service — high-level voice-streaming interface wrapping LlmClient.

Uses LlmClient (ai_client) instead of calling Gemini API directly.
Provides methods the voice-streaming orchestrator calls for text generation.
"""

import logging
from typing import Any, AsyncIterator, Dict, List, Optional

from ai_client import LlmClient

logger = logging.getLogger(__name__)


class LlmService:
    """High-level LLM service for voice-streaming use cases.

    Accepts an LlmClient via constructor injection and provides
    orchestrator-friendly methods that delegate to ai-service.
    """

    def __init__(self, llm_client: LlmClient) -> None:
        self._client = llm_client

    async def generate_response(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Generate a single text response for a given prompt.

        Args:
            prompt: The text prompt.
            options: Optional generation options (temperature, max_tokens, etc.).

        Returns:
            The generated text.
        """
        logger.debug("Generating LLM response for prompt length=%d", len(prompt))
        return await self._client.generate(prompt, options=options)

    async def generate_response_stream(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[str]:
        """Stream a text response chunk-by-chunk.

        Args:
            prompt: The text prompt.
            options: Optional generation options.

        Yields:
            Text chunks as they arrive from ai-service.
        """
        logger.debug("Streaming LLM response for prompt length=%d", len(prompt))
        async for chunk in self._client.generate_stream(prompt, options=options):
            yield chunk

    async def build_prompt_and_generate(
        self,
        conversation_history: List[Dict[str, str]],
        system_instruction: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build a prompt from conversation history and generate a response.

        Combines system instruction with conversation turns into a single
        prompt string, then delegates to LlmClient.

        Args:
            conversation_history: List of {"role": ..., "content": ...} dicts.
            system_instruction: System-level instruction prepended to the prompt.
            options: Optional generation options.

        Returns:
            The generated text.
        """
        parts = [system_instruction]
        for turn in conversation_history:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            parts.append(f"{role}: {content}")
        prompt = "\n".join(parts)
        return await self._client.generate(prompt, options=options)
