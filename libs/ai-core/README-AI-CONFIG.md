# AI Configuration Module

This module provides centralized configuration for AI models, API endpoints, and character configurations.

## Overview

The AI Configuration module provides a centralized way to manage:
- AI model configurations (endpoints, API keys, models)
- Character configurations for different AI personas
- Provider-specific settings for various AI services

## Available Providers

The following AI providers are pre-configured:

1. **Cerebras AI**
   - Base URL: `https://api.cerebras.ai/v1/chat/completions`
   - Multiple API keys for load balancing

2. **Sarvam AI**
   - Chat completions endpoint
   - Text-to-Speech (TTS) endpoint

3. **OpenRouter**
   - Unified API for multiple LLM providers

4. **DeepSeek**
   - Multiple model variants (V1, V2, V2.5, V3, R1, VL, CODER)

5. **Cohere**
   - Multiple models (command-a-03-2025, command-r-plus-08-2024, etc.)
   - Multiple API keys for load balancing

6. **Firecrawl**
   - Web scraping and content extraction

7. **Brave Search**
   - Web search API

## Character Configurations

The module includes pre-configured character personas:

1. **Narendra Modi** - Prime Minister of India persona
2. **Yogi Adityanath** - Chief Minister of Uttar Pradesh persona  
3. **Physics Wallah (Alakh Pandey)** - Educational persona
4. **Albert Einstein** - Scientific persona

## Usage Examples

### Basic Usage

```typescript
import { AIConfigService } from '@ai-platform/ai-core';

// Get all available providers
const providers = aiConfigService.getAvailableProviders();

// Get a specific provider config
const cohereConfig = aiConfigService.getModelConfig('cohere');

// Get a random API key for load balancing
const apiKey = aiConfigService.getRandomApiKey('cohere');

// Get all available characters
const characters = aiConfigService.getCharacters();
```

### Using in Controllers

```typescript
import { Controller, Get, Inject } from '@nestjs/common';
import { AIConfigService } from '@ai-platform/ai-core';

@Controller('ai')
export class AIController {
  constructor(
    @Inject(AIConfigService)
    private readonly aiConfig: AIConfigService
  ) {}

  @Get('providers')
  getProviders() {
    return this.aiConfig.getAvailableProviders();
  }
}
```

## Configuration Structure

Each provider configuration includes:
- Base URL for API calls
- Multiple API keys for load balancing
- Available models
- Default model for the provider

## Adding New Providers

To add a new provider:

1. Add configuration in `ai-models.config.ts`
2. Add to the provider registry in `AIConfigService`
3. Update the provider list in the service

## Environment Variables

The module can be configured using environment variables for API keys and endpoints, but also provides fallback to the pre-configured keys.

## API Endpoints

The module provides REST endpoints for:
- Listing available providers
- Getting provider configurations
- Getting character configurations
- Getting API keys (with rotation)

## Security Notes

- API keys are stored in the configuration but should be managed securely in production
- Consider using environment variables for production API keys
- Rotate API keys regularly using the multiple key support