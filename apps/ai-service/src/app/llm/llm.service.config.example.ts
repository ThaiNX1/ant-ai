// Example of using AI Config in LLM Service
import { Injectable, Inject } from '@nestjs/common';
import { AIConfigService } from '@ai-platform/ai-core';

@Injectable()
export class LlmServiceWithConfig {
  constructor(
    @Inject(AIConfigService)
    private readonly aiConfig: AIConfigService,
  ) {}

  async generateWithConfig(prompt: string, provider: string = 'cohere') {
    // Get provider configuration
    const providerConfig = this.aiConfig.getModelConfig(provider);
    
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`);
    }

    // Get a random API key for load balancing
    const apiKey = this.aiConfig.getRandomApiKey(provider);
    
    // Get default model for the provider
    const model = providerConfig.defaultModel || providerConfig.models[0];
    
    // Example API call structure
    const requestBody = {
      model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    // Make API call (example using fetch)
    const response = await fetch(providerConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    return response.json();
  }

  async generateWithCharacter(prompt: string, characterId: string, provider: string = 'cohere') {
    // Get character configuration
    const character = this.aiConfig.getCharacterById(characterId);
    
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    // Get provider configuration
    const providerConfig = this.aiConfig.getModelConfig(provider);
    
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`);
    }

    // Get API key
    const apiKey = this.aiConfig.getRandomApiKey(provider);
    const model = providerConfig.defaultModel || providerConfig.models[0];

    // Combine character system prompt with user prompt
    const fullPrompt = `${character.systemPrompt}\n\nUser: ${prompt}\n\n${character.name}:`;

    const requestBody = {
      model,
      messages: [
        { role: 'system', content: character.systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    const response = await fetch(providerConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    return response.json();
  }

  async getAvailableOptions() {
    return {
      providers: this.aiConfig.getAvailableModels(),
      characters: this.aiConfig.getCharacters(),
      totalProviders: this.aiConfig.getProviderConfigs().length,
    };
  }

  async rotateApiKey(provider: string, currentKeyIndex: number): Promise<string> {
    const providerConfig = this.aiConfig.getModelConfig(provider);
    
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not found`);
    }

    // Get next API key in rotation
    const nextIndex = (currentKeyIndex + 1) % providerConfig.apiKeys.length;
    return this.aiConfig.getApiKey(provider, nextIndex);
  }
}