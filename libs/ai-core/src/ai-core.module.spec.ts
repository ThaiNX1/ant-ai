import { Test } from '@nestjs/testing';
import { AiCoreModule } from './ai-core.module';
import { AiCoreOptions } from './interfaces/ai-core-options.interface';
import {
  LLM_ADAPTER,
  TTS_ADAPTER,
  STT_ADAPTER,
  REALTIME_ADAPTER,
  namedToken,
} from './constants/injection-tokens';

describe('AiCoreModule', () => {
  it('should register LLM adapter with default and named tokens', async () => {
    const options: AiCoreOptions = {
      llm: { name: 'gemini', provider: 'gemini', model: 'gemini-pro', apiKey: 'test-key' },
    };
    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(LLM_ADAPTER)).toBeDefined();
    expect(module.get(namedToken('LLM', 'gemini'))).toBeDefined();
  });

  it('should register TTS adapter', async () => {
    const options: AiCoreOptions = {
      tts: { name: 'elevenlabs', provider: 'elevenlabs', model: 'eleven_monolingual_v1', apiKey: 'test-key' },
    };
    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(TTS_ADAPTER)).toBeDefined();
    expect(module.get(namedToken('TTS', 'elevenlabs'))).toBeDefined();
  });

  it('should register STT adapter', async () => {
    const options: AiCoreOptions = {
      stt: { name: 'whisper', provider: 'openai', model: 'whisper-1', apiKey: 'test-key' },
    };
    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(STT_ADAPTER)).toBeDefined();
    expect(module.get(namedToken('STT', 'whisper'))).toBeDefined();
  });

  it('should register Realtime adapter', async () => {
    const options: AiCoreOptions = {
      realtime: { name: 'openai-rt', provider: 'openai', model: 'gpt-4o-realtime', apiKey: 'test-key' },
    };
    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(REALTIME_ADAPTER)).toBeDefined();
    expect(module.get(namedToken('REALTIME', 'openai-rt'))).toBeDefined();
  });

  it('should register multiple LLM adapters', async () => {
    const options: AiCoreOptions = {
      llm: [
        { name: 'gemini-flash', provider: 'gemini', model: 'gemini-2.5-flash', apiKey: 'key1' },
        { name: 'gemini-pro', provider: 'gemini', model: 'gemini-2.5-pro', apiKey: 'key2' },
      ],
    };
    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    // Default token resolves to first adapter
    expect(module.get(LLM_ADAPTER)).toBeDefined();
    // Named tokens
    expect(module.get(namedToken('LLM', 'gemini-flash'))).toBeDefined();
    expect(module.get(namedToken('LLM', 'gemini-pro'))).toBeDefined();
  });

  it('should register all adapter types', async () => {
    const options: AiCoreOptions = {
      llm: { name: 'llm', provider: 'gemini', model: 'gemini-pro', apiKey: 'k1' },
      tts: { name: 'tts', provider: 'elevenlabs', model: 'eleven_monolingual_v1', apiKey: 'k2' },
      stt: { name: 'stt', provider: 'openai', model: 'whisper-1', apiKey: 'k3' },
      realtime: { name: 'rt', provider: 'openai', model: 'gpt-4o-realtime', apiKey: 'k4' },
    };
    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(LLM_ADAPTER)).toBeDefined();
    expect(module.get(TTS_ADAPTER)).toBeDefined();
    expect(module.get(STT_ADAPTER)).toBeDefined();
    expect(module.get(REALTIME_ADAPTER)).toBeDefined();
  });

  it('should register no providers when empty config is provided', () => {
    const dynamicModule = AiCoreModule.register({});
    expect(dynamicModule.providers).toEqual([]);
    expect(dynamicModule.exports).toEqual([]);
  });

  it('should use first adapter as default token', async () => {
    const options: AiCoreOptions = {
      llm: [
        { name: 'first', provider: 'gemini', model: 'gemini-2.5-flash', apiKey: 'k1' },
        { name: 'second', provider: 'gemini', model: 'gemini-2.5-pro', apiKey: 'k2' },
      ],
    };
    const dynamicModule = AiCoreModule.register(options);

    const defaultProvider = dynamicModule.providers?.find(
      (p: any) => p.provide === LLM_ADAPTER,
    );
    expect(defaultProvider).toBeDefined();
  });
});
