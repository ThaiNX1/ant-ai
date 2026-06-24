import { OpenAI } from 'openai';
import { ITtsAdapter } from '../interfaces/tts.interface';
import { TtsOptions } from '../interfaces/tts-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

type OpenAiTtsVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer';
type OpenAiTtsModel = 'tts-1' | 'tts-1-hd';
type OpenAiTtsFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

const DEFAULT_VOICE: OpenAiTtsVoice = 'nova';
const DEFAULT_MODEL: OpenAiTtsModel = 'tts-1';

/**
 * OpenAI TTS Adapter — uses the openai SDK (Audio Speech).
 *
 * Models:
 *   - tts-1: Optimized for speed ($15/1M chars)
 *   - tts-1-hd: Optimized for quality ($30/1M chars)
 *
 * Voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer
 */
export class OpenAiTtsAdapter implements ITtsAdapter {
  private readonly client: OpenAI;
  private readonly modelName: OpenAiTtsModel;

  constructor(private readonly config: AdapterConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.modelName = (config.model as OpenAiTtsModel) || DEFAULT_MODEL;
  }

  async synthesize(text: string, options?: TtsOptions): Promise<Buffer> {
    try {
      const response = await this.client.audio.speech.create({
        model: this.modelName,
        voice: this.mapVoice(options?.voiceId),
        input: text,
        response_format: this.mapFormat(options?.format),
        speed: options?.speed ?? 1.0,
      });

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  async *streamSynthesize(text: string, options?: TtsOptions): AsyncIterable<Buffer> {
    try {
      const response = await this.client.audio.speech.create({
        model: this.modelName,
        voice: this.mapVoice(options?.voiceId),
        input: text,
        response_format: this.mapFormat(options?.format),
        speed: options?.speed ?? 1.0,
      });

      const stream = response.body;
      if (!stream) {
        throw new AdapterError('EMPTY_STREAM', 'OpenAI TTS returned empty stream', 'openai');
      }

      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            yield Buffer.from(value);
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: unknown) {
      if (error instanceof AdapterError) throw error;
      throw this.wrapError(error);
    }
  }

  private mapVoice(voiceId?: string): OpenAiTtsVoice {
    const validVoices: OpenAiTtsVoice[] = [
      'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer',
    ];
    if (voiceId && validVoices.includes(voiceId as OpenAiTtsVoice)) {
      return voiceId as OpenAiTtsVoice;
    }
    return DEFAULT_VOICE;
  }

  private mapFormat(format?: string): OpenAiTtsFormat {
    const validFormats: OpenAiTtsFormat[] = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'];
    if (format && validFormats.includes(format as OpenAiTtsFormat)) {
      return format as OpenAiTtsFormat;
    }
    return 'mp3';
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown OpenAI TTS error';
    const code =
      (error as { status?: number })?.status?.toString() ?? 'OPENAI_TTS_ERROR';
    return new AdapterError(code, message, 'openai');
  }
}
