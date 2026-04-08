import { Controller, Get, Inject } from '@nestjs/common';
import { AIConfigService, AIModelConfig, CharacterConfig } from '@ai-platform/ai-core';

@Controller('llm/config')
export class LlmConfigController {
  constructor(
    @Inject(AIConfigService)
    private readonly aiConfigService: AIConfigService,
  ) {}

  @Get('providers')
  getAvailableProviders(): string[] {
    return this.aiConfigService.getAvailableModels();
  }

  @Get('characters')
  getCharacters(): CharacterConfig[] {
    return this.aiConfigService.getCharacters();
  }

  @Get('characters/default')
  getDefaultCharacter(): CharacterConfig | undefined {
    return this.aiConfigService.getDefaultCharacter();
  }

  @Get('characters/:id')
  getCharacterById(id: string): CharacterConfig | undefined {
    return this.aiConfigService.getCharacterById(id);
  }

  @Get('config/:provider')
  getProviderConfig(provider: string): AIModelConfig | undefined {
    return this.aiConfigService.getModelConfig(provider);
  }

  @Get('all-configs')
  getAllConfigs(): AIModelConfig[] {
    return this.aiConfigService.getProviderConfigs();
  }
}