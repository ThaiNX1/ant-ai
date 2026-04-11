import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { ITtsAdapter } from '../interfaces/tts.interface';
import { TtsOptions } from '../interfaces/tts-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const DEFAULT_VOICE_NAME = 'en-US-Studio-O';
const DEFAULT_LANGUAGE_CODE = 'en-US';

/**
 * Google Cloud TTS Adapter — uses @google-cloud/text-to-speech SDK.
 *
 * Authentication: set GOOGLE_APPLICATION_CREDENTIALS env var
 * or pass apiKey in AdapterConfig.
 */
export class GoogleTtsAdapter implements ITtsAdapter {
  private readonly client: TextToSpeechClient;

  constructor(private readonly config: AdapterConfig) {
    this.client = config.apiKey
      ? new TextToSpeechClient({ apiKey: config.apiKey })
      : new TextToSpeechClient();
  }

  async synthesize(text: string, options?: TtsOptions): Promise<Buffer> {
    try {
      const voiceName = options?.voiceId ?? DEFAULT_VOICE_NAME;
      const languageCode =
        (options?.['languageCode'] as string) ??
        this.extractLanguageCode(voiceName);

      const [response] = await this.client.synthesizeSpeech({
        input: { text },
        voice: {
          name: voiceName,
          languageCode,
        },
        audioConfig: {
          audioEncoding: this.mapEncoding(options?.format),
          speakingRate: options?.speed ?? 1.0,
          pitch: options?.pitch ?? 0,
        },
      });

      if (!response.audioContent) {
        throw new Error('Empty audio content from Google TTS');
      }

      return Buffer.from(response.audioContent as Uint8Array);
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  async *streamSynthesize(
    text: string,
    options?: TtsOptions,
  ): AsyncIterable<Buffer> {
    try {
      const voiceName = options?.voiceId ?? DEFAULT_VOICE_NAME;
      const languageCode =
        (options?.['languageCode'] as string) ??
        this.extractLanguageCode(voiceName);

      const stream = this.client.streamingSynthesize();

      // Send the streaming config + text input
      stream.write({
        streamingConfig: {
          voice: {
            name: voiceName,
            languageCode,
          },
          audioConfig: {
            audioEncoding: this.mapEncoding(options?.format),
            speakingRate: options?.speed ?? 1.0,
            pitch: options?.pitch ?? 0,
          },
        },
      });
      stream.write({ input: { text } });
      stream.end();

      for await (const response of stream) {
        if (response.audioContent) {
          yield Buffer.from(response.audioContent as Uint8Array);
        }
      }
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  /**
   * Extract language code from voice name (e.g. 'en-US-Studio-O' → 'en-US')
   */
  private extractLanguageCode(voiceName: string): string {
    const parts = voiceName.split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }
    return DEFAULT_LANGUAGE_CODE;
  }

  private mapEncoding(
    format?: string,
  ): 'LINEAR16' | 'MP3' | 'OGG_OPUS' | 'MULAW' | 'ALAW' {
    switch (format?.toLowerCase()) {
      case 'wav':
      case 'linear16':
        return 'LINEAR16';
      case 'ogg':
      case 'ogg_opus':
        return 'OGG_OPUS';
      case 'mulaw':
        return 'MULAW';
      case 'alaw':
        return 'ALAW';
      default:
        return 'MP3';
    }
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown Google TTS error';
    const code =
      (error as { code?: number })?.code?.toString() ?? 'GOOGLE_TTS_ERROR';
    return new AdapterError(code, message, 'google-tts');
  }
}
