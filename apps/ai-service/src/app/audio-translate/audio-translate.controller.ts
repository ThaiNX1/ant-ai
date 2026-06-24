import {
  Controller,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AudioTranslateService, TranslateOptions } from './audio-translate.service';

/**
 * Audio Translate Controller
 *
 * Pipeline: Audio file → STT (Deepgram) → LLM translate (Gemini Flash) → TTS (OpenAI) → Audio response
 *
 * Accepts multipart/form-data with:
 *   - audio: file (required) — audio file to translate
 *   - sourceLanguage: string (required) — e.g. 'vi', 'en', 'ja'
 *   - targetLanguage: string (required) — e.g. 'en', 'vi', 'ja'
 *   - voiceId: string (optional) — OpenAI TTS voice (alloy, nova, echo, etc.)
 *   - audioFormat: string (optional) — input audio format hint (wav, mp3, webm, etc.)
 *   - outputFormat: string (optional) — output audio format (mp3, wav, opus, aac)
 *
 * Response modes:
 *   - Default: returns JSON { originalText, translatedText, audio (base64) }
 *   - With header Accept: audio/* → returns raw audio stream
 */
@Controller('audio-translate')
export class AudioTranslateController {
  private readonly logger = new Logger(AudioTranslateController.name);

  constructor(
    private readonly audioTranslateService: AudioTranslateService,
  ) { }

  /**
   * POST /api/v1/audio-translate
   * Multipart form: audio file + translation params
   * Returns JSON with base64 audio or streams raw audio based on Accept header
   */
  @Post()
  async translate(
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const data = await this.parseMultipart(req);

    const options: TranslateOptions = {
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      voiceId: data.voiceId,
      audioFormat: data.audioFormat,
      outputFormat: data.outputFormat,
      sourceLanguages: data.sourceLanguages
    };

    const acceptHeader = req.headers['accept'] || '';
    const wantRawAudio = acceptHeader.includes('audio/');

    if (wantRawAudio) {
      // Stream raw audio response
      await this.streamAudioResponse(data.audioBuffer, options, reply);
    } else {
      // JSON response with base64 audio
      const result = await this.audioTranslateService.translate(
        data.audioBuffer,
        options,
      );

      reply.status(200).send({
        originalText: result.originalText,
        translatedText: result.translatedText,
        audio: result.audio.toString('base64'),
        audioContentType: result.audioContentType,
      });
    }
  }

  /**
   * POST /api/v1/audio-translate/stream
   * Same multipart input, but always returns raw audio stream
   */
  @Post('stream')
  async translateStream(
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const data = await this.parseMultipart(req);

    const options: TranslateOptions = {
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      voiceId: data.voiceId,
      audioFormat: data.audioFormat,
      outputFormat: data.outputFormat,
      sourceLanguages: data.sourceLanguages
    };

    await this.streamAudioResponse(data.audioBuffer, options, reply);
  }

  private async streamAudioResponse(
    audioBuffer: Buffer,
    options: TranslateOptions,
    reply: FastifyReply,
  ): Promise<void> {
    const contentType = this.mapContentType(options.outputFormat || 'mp3');

    try {
      for await (const chunk of this.audioTranslateService.translateStream(audioBuffer, options)) {
        if (!reply.raw.headersSent) {
          reply.raw.writeHead(200, {
            'Content-Type': contentType,
            'Transfer-Encoding': 'chunked',
          });
        }
        reply.raw.write(chunk);
      }
      reply.raw.end();
    } catch (error: unknown) {
      if (reply.raw.headersSent) {
        reply.raw.end();
      } else {
        throw error;
      }
    }
  }

  private async parseMultipart(req: FastifyRequest): Promise<{
    audioBuffer: Buffer;
    sourceLanguage: string;
    targetLanguage: string;
    voiceId?: string;
    audioFormat?: string;
    sampleRate?: number;
    channels?: number;
    encoding?: string;
    outputFormat?: string;
    sourceLanguages?: string[];
  }> {
    let audioBuffer: Buffer | null = null;
    let detectedFormat: string | undefined;
    const fields: Record<string, string> = {};
    const repeatedFields: Record<string, string[]> = {};

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        // Collect audio file
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        audioBuffer = Buffer.concat(chunks);
        // Prefer the actual bytes over client supplied metadata. Browsers often
        // upload recordings as application/octet-stream or stale extensions.
        detectedFormat =
          this.detectAudioFormatFromBuffer(audioBuffer) ??
          this.detectAudioFormat(part.mimetype, part.filename);
        this.logger.log(
          `[Multipart] audio field="${part.fieldname}" filename="${part.filename ?? ''}" ` +
          `mimetype="${part.mimetype ?? ''}" bytes=${audioBuffer.length} ` +
          `detectedFormat="${detectedFormat ?? 'unknown'}"`,
        );
      } else {
        // Collect form fields
        const value = part.value as string;
        fields[part.fieldname] = value;
        repeatedFields[part.fieldname] = [
          ...(repeatedFields[part.fieldname] ?? []),
          value,
        ];
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      this.logger.warn('[Multipart] rejected: missing or empty audio file');
      throw new HttpException(
        'Audio file is required. Send as multipart/form-data with field name "audio".',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!fields['sourceLanguage']) {
      this.logger.warn('[Multipart] rejected: missing sourceLanguage');
      throw new HttpException(
        'sourceLanguage is required (e.g. "vi", "en", "ja")',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!fields['targetLanguage']) {
      this.logger.warn('[Multipart] rejected: missing targetLanguage');
      throw new HttpException(
        'targetLanguage is required (e.g. "en", "vi", "ja")',
        HttpStatus.BAD_REQUEST,
      );
    }

    const audioFormat = detectedFormat || fields['audioFormat'];
    const sampleRate = this.parseOptionalPositiveInteger(
      fields['sampleRate'] || fields['sample_rate'],
      'sampleRate',
    );
    const channels = this.parseOptionalPositiveInteger(
      fields['channels'],
      'channels',
    );
    const encoding = fields['encoding'];
    const sourceLanguages = this.parseOptionalStringList([
      ...(repeatedFields['sourceLanguages'] ?? []),
      ...(repeatedFields['sourceLanguages[]'] ?? []),
    ]);

    if (this.isRawPcmFormat(audioFormat) && !sampleRate) {
      this.logger.warn(
        `[Multipart] rejected: raw PCM requires sampleRate. ` +
        `audioFormat="${audioFormat ?? ''}" clientAudioFormat="${fields['audioFormat'] ?? ''}" ` +
        `channels="${channels ?? ''}" encoding="${encoding ?? ''}"`,
      );
      throw new HttpException(
        'sampleRate is required when audioFormat is raw PCM (e.g. audioFormat=pcm&sampleRate=16000&channels=1).',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(
      `[Multipart] selected audioFormat="${audioFormat ?? 'unknown'}" ` +
      `clientAudioFormat="${fields['audioFormat'] ?? ''}" ` +
      `sampleRate="${sampleRate ?? ''}" channels="${channels ?? ''}" ` +
      `encoding="${encoding ?? ''}" ` +
      `sourceLanguages="${sourceLanguages?.join(',') ?? ''}"`,
    );

    return {
      audioBuffer,
      sourceLanguage: fields['sourceLanguage'],
      targetLanguage: fields['targetLanguage'],
      voiceId: fields['voiceId'],
      audioFormat,
      sampleRate,
      channels,
      encoding,
      outputFormat: fields['outputFormat'],
      sourceLanguages,
    };
  }

  private parseOptionalStringList(values: string[]): string[] | undefined {
    const parsed = values
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return parsed.length > 0 ? Array.from(new Set(parsed)) : undefined;
  }

  private parseOptionalPositiveInteger(
    value: string | undefined,
    fieldName: string,
  ): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new HttpException(
        `${fieldName} must be a positive integer.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return parsed;
  }

  private isRawPcmFormat(format: string | undefined): boolean {
    return ['pcm', 'linear16', 'raw', 's16le'].includes(
      format?.toLowerCase() ?? '',
    );
  }

  private detectAudioFormatFromBuffer(buffer: Buffer): string | undefined {
    if (buffer.length < 4) {
      return undefined;
    }

    if (buffer.subarray(0, 3).toString('ascii') === 'ID3') {
      return 'mp3';
    }

    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
      return 'mp3';
    }

    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WAVE'
    ) {
      return 'wav';
    }

    if (buffer.subarray(0, 4).toString('ascii') === 'OggS') {
      return 'ogg';
    }

    if (buffer.subarray(0, 4).toString('ascii') === 'fLaC') {
      return 'flac';
    }

    if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
      return 'webm';
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(4, 8).toString('ascii') === 'ftyp'
    ) {
      const brand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
      if (brand.includes('m4a')) {
        return 'm4a';
      }
      return 'mp4';
    }

    return undefined;
  }

  private detectAudioFormat(mimetype?: string, filename?: string): string | undefined {
    // Try mimetype first
    if (mimetype) {
      const mimeMap: Record<string, string | undefined> = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/wave': 'wav',
        'audio/webm': 'webm',
        'audio/ogg': 'ogg',
        'audio/flac': 'flac',
        'audio/aac': 'aac',
        'audio/mp4': 'mp4',
        'audio/x-m4a': 'm4a',
        'audio/m4a': 'm4a',
        'video/mp4': 'mp4',
        'audio/amr': 'amr',
        'audio/opus': 'opus',
        'audio/pcm': 'pcm',
        'audio/l16': 'linear16',
        'audio/x-pcm': 'pcm',
        'application/octet-stream': undefined,
      };
      const format = mimeMap[mimetype.toLowerCase()];
      if (format) return format;
    }

    // Fallback to file extension
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (
        ext &&
        [
          'mp3',
          'wav',
          'webm',
          'ogg',
          'flac',
          'aac',
          'mp4',
          'm4a',
          'amr',
          'opus',
          'pcm',
          'raw',
          's16le',
        ].includes(ext)
      ) {
        return ext;
      }
    }

    return undefined;
  }

  private mapContentType(format: string): string {
    switch (format.toLowerCase()) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'opus': return 'audio/opus';
      case 'aac': return 'audio/aac';
      case 'flac': return 'audio/flac';
      default: return 'audio/mpeg';
    }
  }
}
