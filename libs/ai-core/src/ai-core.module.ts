import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  AiCoreOptions,
  NamedAdapterConfig,
} from './interfaces/ai-core-options.interface';
import {
  LLM_ADAPTER,
  TTS_ADAPTER,
  STT_ADAPTER,
  REALTIME_ADAPTER,
  namedToken,
} from './constants/injection-tokens';
import { AdapterFactory } from './adapters/adapter.factory';

@Module({})
export class AiCoreModule {
  /**
   * Register AI adapters. Each type accepts a single config or an array.
   *
   * Single adapter:
   *   llm: { name: 'default', provider: 'gemini', model: '...', apiKey: '...' }
   *
   * Multiple adapters:
   *   llm: [
   *     { name: 'gemini-flash', provider: 'gemini', model: 'gemini-2.5-flash', apiKey: '...' },
   *     { name: 'gemini-pro', provider: 'gemini', model: 'gemini-2.5-pro', apiKey: '...' },
   *   ]
   *
   * Inject by name: @Inject(namedToken('LLM', 'gemini-flash'))
   * Or use default token: @Inject(LLM_ADAPTER) — resolves to the first registered adapter
   */
  static register(options: AiCoreOptions): DynamicModule {
    const providers: Provider[] = [];
    const exportTokens: string[] = [];

    // LLM adapters
    if (options.llm) {
      const configs = AiCoreModule.toArray(options.llm);
      AiCoreModule.registerAdapters(
        configs, 'LLM', LLM_ADAPTER,
        (c) => AdapterFactory.createLlm(c),
        providers, exportTokens,
      );
    }

    // TTS adapters
    if (options.tts) {
      const configs = AiCoreModule.toArray(options.tts);
      AiCoreModule.registerAdapters(
        configs, 'TTS', TTS_ADAPTER,
        (c) => AdapterFactory.createTts(c),
        providers, exportTokens,
      );
    }

    // STT adapters
    if (options.stt) {
      const configs = AiCoreModule.toArray(options.stt);
      AiCoreModule.registerAdapters(
        configs, 'STT', STT_ADAPTER,
        (c) => AdapterFactory.createStt(c),
        providers, exportTokens,
      );
    }

    // Realtime adapters
    if (options.realtime) {
      const configs = AiCoreModule.toArray(options.realtime);
      AiCoreModule.registerAdapters(
        configs, 'REALTIME', REALTIME_ADAPTER,
        (c) => AdapterFactory.createRealtime(c),
        providers, exportTokens,
      );
    }

    return {
      module: AiCoreModule,
      providers,
      exports: exportTokens,
    };
  }

  private static toArray(
    input: NamedAdapterConfig | NamedAdapterConfig[],
  ): NamedAdapterConfig[] {
    return Array.isArray(input) ? input : [input];
  }

  private static registerAdapters(
    configs: NamedAdapterConfig[],
    type: 'LLM' | 'TTS' | 'STT' | 'REALTIME',
    defaultToken: string,
    factory: (config: NamedAdapterConfig) => unknown,
    providers: Provider[],
    exportTokens: string[],
  ): void {
    configs.forEach((config, index) => {
      const token = namedToken(type, config.name);

      // Register named provider
      providers.push({
        provide: token,
        useFactory: () => factory(config),
      });
      exportTokens.push(token);

      // First adapter also gets the default token for backward compatibility
      if (index === 0) {
        providers.push({
          provide: defaultToken,
          useFactory: () => factory(config),
        });
        exportTokens.push(defaultToken);
      }
    });
  }
}
