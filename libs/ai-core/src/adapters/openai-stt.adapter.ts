import { OpenAI } from 'openai';
import { File } from 'buffer';
import { ISttAdapter } from '../interfaces/stt.interface';
import { SttOptions } from '../interfaces/stt-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

/**
 * OpenAI STT Adapter — uses the openai SDK (Whisper).
 */
export class OpenAiSttAdapter implements ISttAdapter {
  private readonly client: OpenAI;

  constructor(private readonly config: AdapterConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async transcribeAudio(
    audio: Buffer,
    options?: SttOptions,
  ): Promise<string> {
    try {
      const file = new File([audio], 'audio.wav', { type: 'audio/wav' });

      const transcription = await this.client.audio.transcriptions.create({
        file,
        model: this.config.model || 'whisper-1',
        language: options?.language,
        response_format: 'text',
      });

      return transcription as unknown as string;
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown OpenAI STT error';
    const code =
      (error as { status?: number })?.status?.toString() ?? 'OPENAI_STT_ERROR';
    return new AdapterError(code, message, 'openai');
  }
}
