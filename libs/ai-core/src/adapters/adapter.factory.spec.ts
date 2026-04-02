import { AdapterFactory } from './adapter.factory';
import { GeminiLlmAdapter } from './gemini-llm.adapter';
import { ElevenLabsTtsAdapter } from './elevenlabs-tts.adapter';
import { OpenAiSttAdapter } from './openai-stt.adapter';
import { OpenAiRealtimeAdapter } from './openai-realtime.adapter';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

describe('AdapterFactory', () => {
  const baseConfig: AdapterConfig = {
    provider: '',
    model: 'test-model',
    apiKey: 'test-key',
  };

  describe('createLlm', () => {
    it('should create GeminiLlmAdapter for provider "gemini"', () => {
      const adapter = AdapterFactory.createLlm({ ...baseConfig, provider: 'gemini' });
      expect(adapter).toBeInstanceOf(GeminiLlmAdapter);
    });

    it('should throw for unknown LLM provider', () => {
      expect(() => AdapterFactory.createLlm({ ...baseConfig, provider: 'unknown' }))
        .toThrow('Unknown LLM provider: unknown');
    });
  });

  describe('createTts', () => {
    it('should create ElevenLabsTtsAdapter for provider "elevenlabs"', () => {
      const adapter = AdapterFactory.createTts({ ...baseConfig, provider: 'elevenlabs' });
      expect(adapter).toBeInstanceOf(ElevenLabsTtsAdapter);
    });

    it('should throw for unknown TTS provider', () => {
      expect(() => AdapterFactory.createTts({ ...baseConfig, provider: 'unknown' }))
        .toThrow('Unknown TTS provider: unknown');
    });
  });

  describe('createStt', () => {
    it('should create OpenAiSttAdapter for provider "openai"', () => {
      const adapter = AdapterFactory.createStt({ ...baseConfig, provider: 'openai' });
      expect(adapter).toBeInstanceOf(OpenAiSttAdapter);
    });

    it('should throw for unknown STT provider', () => {
      expect(() => AdapterFactory.createStt({ ...baseConfig, provider: 'unknown' }))
        .toThrow('Unknown STT provider: unknown');
    });
  });

  describe('createRealtime', () => {
    it('should create OpenAiRealtimeAdapter for provider "openai"', () => {
      const adapter = AdapterFactory.createRealtime({ ...baseConfig, provider: 'openai' });
      expect(adapter).toBeInstanceOf(OpenAiRealtimeAdapter);
    });

    it('should throw for unknown Realtime provider', () => {
      expect(() => AdapterFactory.createRealtime({ ...baseConfig, provider: 'unknown' }))
        .toThrow('Unknown Realtime provider: unknown');
    });
  });
});
