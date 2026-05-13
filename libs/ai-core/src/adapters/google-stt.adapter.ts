import { SpeechClient } from '@google-cloud/speech';
import { ISttAdapter } from '../interfaces/stt.interface';
import { SttOptions } from '../interfaces/stt-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

const DEFAULT_LANGUAGE_CODE = 'en-US';
const DEFAULT_SAMPLE_RATE = 16000;

/**
 * Default candidate languages for auto-detection.
 * Google STT requires a primary languageCode + alternativeLanguageCodes.
 * It will pick the best match from this list.
 */
const DEFAULT_AUTO_DETECT_LANGUAGES = [
  'en-US',
  'vi-VN',
  'ja-JP',
  'zh-CN',
  'ko-KR',
  'fr-FR',
  'de-DE',
  'es-ES',
];

/**
 * Google Cloud STT Adapter — uses @google-cloud/speech SDK.
 *
 * Authentication: set GOOGLE_APPLICATION_CREDENTIALS env var
 * or pass apiKey in AdapterConfig.
 *
 * Auto-detect language: khi không truyền `language` trong SttOptions,
 * adapter sẽ dùng `alternativeLanguageCodes` để Google tự nhận diện ngôn ngữ.
 * Có thể tuỳ chỉnh danh sách candidate qua `options.autoDetectLanguages`.
 */
export class GoogleSttAdapter implements ISttAdapter {
  private readonly client: SpeechClient;

  constructor(private readonly config: AdapterConfig) {
    this.client = config.apiKey
      ? new SpeechClient({ apiKey: config.apiKey })
      : new SpeechClient();
  }

  async transcribeAudio(
    audio: Buffer,
    options?: SttOptions,
  ): Promise<string> {
    try {
      const encoding = this.mapEncoding(options?.format);
      const autoDetect = !options?.language;
      const languageCode = options?.language ?? DEFAULT_LANGUAGE_CODE;

      const recognizeConfig: Record<string, unknown> = {
        encoding,
        sampleRateHertz:
          (options?.['sampleRate'] as number) ?? DEFAULT_SAMPLE_RATE,
        languageCode,
        model: this.config.model || 'default',
      };

      if (autoDetect) {
        const candidates =
          (options?.['autoDetectLanguages'] as string[]) ??
          DEFAULT_AUTO_DETECT_LANGUAGES;
        // alternativeLanguageCodes must not include the primary languageCode
        recognizeConfig['alternativeLanguageCodes'] = candidates.filter(
          (lang) => lang !== languageCode,
        );
      }

      const [response] = await this.client.recognize({
        audio: { content: audio },
        config: recognizeConfig,
      });

      const transcript = response.results
        ?.map((result) => result.alternatives?.[0]?.transcript ?? '')
        .join(' ')
        .trim();

      return transcript || '';
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  private mapEncoding(
    format?: string,
  ):
    | 'LINEAR16'
    | 'FLAC'
    | 'MULAW'
    | 'OGG_OPUS'
    | 'WEBM_OPUS'
    | 'ENCODING_UNSPECIFIED' {
    switch (format?.toLowerCase()) {
      case 'wav':
      case 'linear16':
        return 'LINEAR16';
      case 'flac':
        return 'FLAC';
      case 'mulaw':
        return 'MULAW';
      case 'ogg':
      case 'ogg_opus':
        return 'OGG_OPUS';
      case 'webm':
      case 'webm_opus':
        return 'WEBM_OPUS';
      default:
        return 'ENCODING_UNSPECIFIED';
    }
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown Google STT error';
    const code =
      (error as { code?: number })?.code?.toString() ?? 'GOOGLE_STT_ERROR';
    return new AdapterError(code, message, 'google-stt');
  }
}
