// Example usage of AI Config Service
import { AIConfigService } from './ai-config.service';
import { getRandomApiKey, getModelConfig } from './ai-models.config';

// Example 1: Using AIConfigService
const configService = new AIConfigService();

// Get all available providers
const providers = configService.getAvailableModels();
console.log('Available providers:', providers);

// Get specific provider config
const cohereConfig = configService.getModelConfig('cohere');
console.log('Cohere config:', cohereConfig);

// Get random API key for a provider
const randomApiKey = configService.getRandomApiKey('cohere');
console.log('Random Cohere API key:', randomApiKey);

// Get all characters
const characters = configService.getCharacters();
console.log('Available characters:', characters.length);

// Example 2: Using helper functions
const cerebrasConfig = getModelConfig('cerebras');
if (cerebrasConfig) {
  console.log('Cerebras base URL:', cerebrasConfig.baseUrl);
  console.log('Available API keys:', cerebrasConfig.apiKeys.length);
  
  // Get a random API key
  const randomKey = getRandomApiKey(cerebrasConfig.apiKeys);
  console.log('Random Cerebras API key:', randomKey);
}

// Example 3: Working with characters
const defaultCharacter = configService.getDefaultCharacter();
console.log('Default character:', defaultCharacter?.name);

// Example 4: Get all provider configs
const allConfigs = configService.getProviderConfigs();
console.log('Total providers:', allConfigs.length);

// Example 5: Get specific API key by index
const cohereApiKey = configService.getApiKey('cohere', 0);
console.log('First Cohere API key:', cohereApiKey);

// Example 6: Get all available models
const allModels = configService.getAvailableModels();
console.log('All available models:', allModels);