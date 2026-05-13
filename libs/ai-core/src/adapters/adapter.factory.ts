import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { ILlmAdapter } from '../interfaces/llm.interface';
import { ITtsAdapter } from '../interfaces/tts.interface';
import { ISttAdapter } from '../interfaces/stt.interface';
import { IRealtimeAdapter } from '../interfaces/realtime.interface';
import { GeminiLlmAdapter } from './gemini-llm.adapter';
import { OpenAiLlmAdapter } from './openai-llm.adapter';
import { ElevenLabsTtsAdapter } from './elevenlabs-tts.adapter';
import { OpenAiSttAdapter } from './openai-stt.adapter';
import { OpenAiRealtimeAdapter } from './openai-realtime.adapter';
import { GoogleTtsAdapter } from './google-tts.adapter';
import { GeminiRealtimeAdapter } from './gemini-realtime.adapter';
import { MinimaxTtsAdapter } from './minimax-tts.adapter';

export class AdapterFactory {
  static createLlm(config: AdapterConfig): ILlmAdapter {
    switch (config.provider) {
      case 'gemini':
        return new GeminiLlmAdapter(config);
      case 'openai':
        return new OpenAiLlmAdapter(config);
      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }

  static createTts(config: AdapterConfig): ITtsAdapter {
    switch (config.provider) {
      case 'elevenlabs':
        return new ElevenLabsTtsAdapter(config);
      case 'google-tts':
        return new GoogleTtsAdapter(config);
      case 'minimax':
        return new MinimaxTtsAdapter(config);
      default:
        throw new Error(`Unknown TTS provider: ${config.provider}`);
    }
  }

  static createStt(config: AdapterConfig): ISttAdapter {
    switch (config.provider) {
      case 'openai':
        return new OpenAiSttAdapter(config);
      default:
        throw new Error(`Unknown STT provider: ${config.provider}`);
    }
  }

  static createRealtime(config: AdapterConfig): IRealtimeAdapter {
    switch (config.provider) {
      case 'openai':
        return new OpenAiRealtimeAdapter(config);
      case 'gemini':
        return new GeminiRealtimeAdapter(config);
      default:
        throw new Error(`Unknown Realtime provider: ${config.provider}`);
    }
  }
}
