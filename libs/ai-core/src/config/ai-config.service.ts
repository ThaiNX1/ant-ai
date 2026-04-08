import { Injectable } from '@nestjs/common';
import { 
  AIModelConfig, 
  CharacterConfig, 
  CEREBRAS_CONFIG, 
  SARVAM_CONFIG, 
  SARVAM_TTS_CONFIG, 
  OPENROUTER_CONFIG, 
  DEEPSEEK_CONFIG, 
  COHERE_CONFIG, 
  FIRECRAWL_CONFIG, 
  BRAVE_CONFIG,
  DEFAULT_CHARACTERS,
  getRandomApiKey,
  getModelConfig
} from './ai-models.config';

@Injectable()
export class AIConfigService {
  private readonly modelConfigs: Map<string, AIModelConfig> = new Map();
  private readonly characters: CharacterConfig[] = [];

  constructor() {
    this.initializeModelConfigs();
    this.initializeCharacters();
  }

  private initializeModelConfigs(): void {
    const configs = [
      CEREBRAS_CONFIG,
      SARVAM_CONFIG,
      SARVAM_TTS_CONFIG,
      OPENROUTER_CONFIG,
      DEEPSEEK_CONFIG,
      COHERE_CONFIG,
      FIRECRAWL_CONFIG,
      BRAVE_CONFIG
    ];

    configs.forEach(config => {
      this.modelConfigs.set(config.name, config);
    });
  }

  private initializeCharacters(): void {
    this.characters.push(...DEFAULT_CHARACTERS);
  }

  getModelConfig(provider: string): AIModelConfig | undefined {
    return this.modelConfigs.get(provider);
  }
  getAvailableModels(): string[] {
    return Array.from(this.modelConfigs.keys());
  }

  getCharacters(): CharacterConfig[] {
    return [...this.characters];
  }

  getCharacterById(id: string): CharacterConfig | undefined {
    return this.characters.find(char => char.id === id);
  }

  getDefaultCharacter(): CharacterConfig | undefined {
    return this.characters.find(char => char.isDefault) || this.characters[0];
  }

  getProviderConfigs(): AIModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  getApiKey(provider: string, index: number = 0): string {
    const config = this.getModelConfig(provider);
    if (!config || !config.apiKeys.length) return '';
    
    const idx = index % config.apiKeys.length;
    return config.apiKeys[idx];
  }

  getRandomApiKey(provider: string): string {
    const config = this.getModelConfig(provider);
    if (!config || !config.apiKeys.length) return '';
    
    return getRandomApiKey(config.apiKeys);
  }
}