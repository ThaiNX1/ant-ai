import { ElevenLabsClient } from 'elevenlabs';
import { Readable } from 'stream';
import { ITtsAdapter } from '../interfaces/tts.interface';
import { TtsOptions } from '../interfaces/tts-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

/**
 * ElevenLabs TTS Adapter — uses the elevenlabs SDK.
 */
export class ElevenLabsTtsAdapter implements ITtsAdapter {
  private readonly client: ElevenLabsClient;

  constructor(private readonly config: AdapterConfig) {
    this.client = new ElevenLabsClient({ apiKey: config.apiKey });
  }

  async synthesize(text: string, options?: TtsOptions): Promise<Buffer> {
    try {
      const voiceId = options?.voiceId ?? DEFAULT_VOICE_ID;
      const audioStream: Readable = await this.client.textToSpeech.convert(
        voiceId,
        {
          text,
          model_id: this.config.model,
          output_format: (options?.format as any) ?? 'mp3_44100_128',
        },
      );
      return await this.streamToBuffer(audioStream);
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  async *streamSynthesize(
    text: string,
    options?: TtsOptions,
  ): AsyncIterable<Buffer> {
    try {
      const voiceId = options?.voiceId ?? DEFAULT_VOICE_ID;
      const audioStream: Readable =
        await this.client.textToSpeech.convertAsStream(voiceId, {
          text,
          model_id: this.config.model,
          output_format: (options?.format as any) ?? 'mp3_44100_128',
        });

      for await (const chunk of audioStream) {
        yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      }
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown ElevenLabs error';
    const code =
      (error as { statusCode?: number })?.statusCode?.toString() ??
      'ELEVENLABS_ERROR';
    return new AdapterError(code, message, 'elevenlabs');
  }
}
