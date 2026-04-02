import { Test } from '@nestjs/testing';
import { AiCoreModule } from './ai-core.module';
import { AiCoreOptions } from './interfaces/ai-core-options.interface';
import {
  LLM_ADAPTER,
  TTS_ADAPTER,
  STT_ADAPTER,
  REALTIME_ADAPTER,
} from './constants/injection-tokens';
import { LlmService } from './services/llm.service';
import { TtsService } from './services/tts.service';
import { SttService } from './services/stt.service';
import { RealtimeVoiceService } from './services/realtime-voice.service';
import { VoiceToVoiceService } from './services/voice-to-voice.service';
import { TextToVoiceService } from './services/text-to-voice.service';

describe('AiCoreModule', () => {
  it('should register LLM provider when llm config is provided', async () => {
    const options: AiCoreOptions = {
      llm: { provider: 'gemini', model: 'gemini-pro', apiKey: 'test-key' },
    };

    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(LLM_ADAPTER)).toBeDefined();
    expect(module.get(LlmService)).toBeDefined();
  });

  it('should register TTS provider when tts config is provided', async () => {
    const options: AiCoreOptions = {
      tts: { provider: 'elevenlabs', model: 'eleven_monolingual_v1', apiKey: 'test-key' },
    };

    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(TTS_ADAPTER)).toBeDefined();
    expect(module.get(TtsService)).toBeDefined();
  });

  it('should register STT provider when stt config is provided', async () => {
    const options: AiCoreOptions = {
      stt: { provider: 'openai', model: 'whisper-1', apiKey: 'test-key' },
    };

    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(STT_ADAPTER)).toBeDefined();
    expect(module.get(SttService)).toBeDefined();
  });

  it('should register Realtime provider when realtime config is provided', async () => {
    const options: AiCoreOptions = {
      realtime: { provider: 'openai', model: 'gpt-4o-realtime', apiKey: 'test-key' },
    };

    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(REALTIME_ADAPTER)).toBeDefined();
    expect(module.get(RealtimeVoiceService)).toBeDefined();
  });

  it('should register all providers when full config is provided', async () => {
    const options: AiCoreOptions = {
      llm: { provider: 'gemini', model: 'gemini-pro', apiKey: 'key1' },
      tts: { provider: 'elevenlabs', model: 'eleven_monolingual_v1', apiKey: 'key2' },
      stt: { provider: 'openai', model: 'whisper-1', apiKey: 'key3' },
      realtime: { provider: 'openai', model: 'gpt-4o-realtime', apiKey: 'key4' },
    };

    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(LLM_ADAPTER)).toBeDefined();
    expect(module.get(TTS_ADAPTER)).toBeDefined();
    expect(module.get(STT_ADAPTER)).toBeDefined();
    expect(module.get(REALTIME_ADAPTER)).toBeDefined();
    expect(module.get(LlmService)).toBeDefined();
    expect(module.get(TtsService)).toBeDefined();
    expect(module.get(SttService)).toBeDefined();
    expect(module.get(RealtimeVoiceService)).toBeDefined();
  });

  it('should register no providers when empty config is provided', async () => {
    const options: AiCoreOptions = {};

    const dynamicModule = AiCoreModule.register(options);
    expect(dynamicModule.providers).toEqual([]);
    expect(dynamicModule.exports).toEqual([]);
  });

  it('should register TextToVoiceService when both llm and tts are configured', async () => {
    const options: AiCoreOptions = {
      llm: { provider: 'gemini', model: 'gemini-pro', apiKey: 'key1' },
      tts: { provider: 'elevenlabs', model: 'eleven_monolingual_v1', apiKey: 'key2' },
    };

    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(TextToVoiceService)).toBeDefined();
  });

  it('should not register TextToVoiceService when only llm is configured', async () => {
    const options: AiCoreOptions = {
      llm: { provider: 'gemini', model: 'gemini-pro', apiKey: 'key1' },
    };

    const dynamicModule = AiCoreModule.register(options);
    const hasTextToVoice = dynamicModule.providers?.some(
      (p) => p === TextToVoiceService,
    );
    expect(hasTextToVoice).toBe(false);
  });

  it('should register VoiceToVoiceService when both realtime and tts are configured', async () => {
    const options: AiCoreOptions = {
      realtime: { provider: 'openai', model: 'gpt-4o-realtime', apiKey: 'key1' },
      tts: { provider: 'elevenlabs', model: 'eleven_monolingual_v1', apiKey: 'key2' },
    };

    const module = await Test.createTestingModule({
      imports: [AiCoreModule.register(options)],
    }).compile();

    expect(module.get(VoiceToVoiceService)).toBeDefined();
  });

  it('should not register VoiceToVoiceService when only realtime is configured', async () => {
    const options: AiCoreOptions = {
      realtime: { provider: 'openai', model: 'gpt-4o-realtime', apiKey: 'key1' },
    };

    const dynamicModule = AiCoreModule.register(options);
    const hasVoiceToVoice = dynamicModule.providers?.some(
      (p) => p === VoiceToVoiceService,
    );
    expect(hasVoiceToVoice).toBe(false);
  });
});
