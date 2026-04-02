"""Unit tests for LlmService."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from services.llm_service import LlmService


def _make_llm_client():
    """Create a mock LlmClient."""
    client = MagicMock()
    client.generate = AsyncMock()
    client.generate_stream = MagicMock()
    return client


class TestLlmServiceGenerateResponse:
    """Test LlmService.generate_response()."""

    @pytest.mark.asyncio
    async def test_returns_generated_text(self):
        client = _make_llm_client()
        client.generate.return_value = "Hello from AI"
        service = LlmService(client)

        result = await service.generate_response("Say hello")
        assert result == "Hello from AI"

    @pytest.mark.asyncio
    async def test_passes_options_to_client(self):
        client = _make_llm_client()
        client.generate.return_value = "ok"
        service = LlmService(client)

        await service.generate_response("prompt", options={"temperature": 0.5})
        client.generate.assert_called_once_with("prompt", options={"temperature": 0.5})

    @pytest.mark.asyncio
    async def test_passes_none_options_by_default(self):
        client = _make_llm_client()
        client.generate.return_value = "ok"
        service = LlmService(client)

        await service.generate_response("prompt")
        client.generate.assert_called_once_with("prompt", options=None)


class TestLlmServiceGenerateResponseStream:
    """Test LlmService.generate_response_stream()."""

    @pytest.mark.asyncio
    async def test_yields_chunks_from_client(self):
        client = _make_llm_client()

        async def _mock_stream(prompt, options=None):
            for chunk in ["Hello", " ", "World"]:
                yield chunk

        client.generate_stream = _mock_stream
        service = LlmService(client)

        chunks = []
        async for chunk in service.generate_response_stream("Say hello"):
            chunks.append(chunk)

        assert chunks == ["Hello", " ", "World"]


class TestLlmServiceBuildPromptAndGenerate:
    """Test LlmService.build_prompt_and_generate()."""

    @pytest.mark.asyncio
    async def test_builds_prompt_from_history(self):
        client = _make_llm_client()
        client.generate.return_value = "AI response"
        service = LlmService(client)

        history = [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello!"},
        ]
        result = await service.build_prompt_and_generate(
            history, "You are a helpful assistant."
        )

        assert result == "AI response"
        call_args = client.generate.call_args
        prompt = call_args[0][0]
        assert "You are a helpful assistant." in prompt
        assert "user: Hi" in prompt
        assert "assistant: Hello!" in prompt

    @pytest.mark.asyncio
    async def test_empty_history(self):
        client = _make_llm_client()
        client.generate.return_value = "response"
        service = LlmService(client)

        result = await service.build_prompt_and_generate([], "System instruction")

        assert result == "response"
        call_args = client.generate.call_args
        prompt = call_args[0][0]
        assert prompt == "System instruction"
