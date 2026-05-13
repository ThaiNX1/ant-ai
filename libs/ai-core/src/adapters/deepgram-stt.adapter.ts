import { ISttAdapter } from '../interfaces/stt.interface';
import { SttOptions } from '../interfaces/stt-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

/**
 * Deepgram STT Adapter — batch transcription via REST API.
 * Uses native fetch to POST audio to Deepgram's /v1/listen endpoint.
 */
export class DeepgramSttAdapter implements ISttAdapter {
  constructor(private readonly config: AdapterConfig) {}

  async transcribeAudio(
    audio: Buffer,
    options?: SttOptions,
  ): Promise<string> {
    try {
      const url = this.buildUrl(options);
      const contentType = this.mapContentType(options?.format);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'Content-Type': contentType,
        },
        body: audio,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AdapterError(
          response.status.toString(),
          errorBody || response.statusText,
          'deepgram',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      const transcript =
        data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';

      return transcript;
    } catch (error: unknown) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw this.wrapError(error);
    }
  }

  private buildUrl(options?: SttOptions): URL {
    const url = new URL(DEEPGRAM_API_URL);
    url.searchParams.set('model', this.config.model || 'nova-3');
    url.searchParams.set('punctuate', 'true');

    if (options?.language) {
      url.searchParams.set('language', options.language);
    }

    return url;
  }

  private mapContentType(format?: string): string {
    switch (format?.toLowerCase()) {
      case 'wav':
      case 'linear16':
        return 'audio/wav';
      case 'flac':
        return 'audio/flac';
      case 'mp3':
        return 'audio/mpeg';
      case 'ogg':
      case 'ogg_opus':
        return 'audio/ogg';
      case 'webm':
      case 'webm_opus':
        return 'audio/webm';
      case 'mulaw':
        return 'audio/basic';
      default:
        return 'audio/wav';
    }
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown Deepgram STT error';
    const code =
      (error as { status?: number })?.status?.toString() ?? 'DEEPGRAM_STT_ERROR';
    return new AdapterError(code, message, 'deepgram');
  }
}
