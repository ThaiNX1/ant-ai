import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ISttAdapter,
  ILlmAdapter,
  ITtsAdapter,
  namedToken,
} from '@ai-platform/ai-core';

export interface TranslateOptions {
  sourceLanguage: string;
  targetLanguage: string;
  voiceId?: string;
  audioFormat?: string;
  outputFormat?: string;
}

export interface TranslateResult {
  originalText: string;
  translatedText: string;
  audio: Buffer;
  audioContentType: string;
}

@Injectable()
export class AudioTranslateService {
  private readonly logger = new Logger(AudioTranslateService.name);

  constructor(
    @Inject(namedToken('STT', 'deepgram'))
    private readonly sttAdapter: ISttAdapter,
    @Inject(namedToken('LLM', 'qwen-flash'))
    private readonly llmAdapter: ILlmAdapter,
    @Inject(namedToken('TTS', 'minimax'))
    private readonly ttsAdapter: ITtsAdapter,
  ) {}

  /**
   * Full pipeline: Audio → STT → LLM Translate → TTS → Audio
   */
  async translate(
    audioBuffer: Buffer,
    options: TranslateOptions,
  ): Promise<TranslateResult> {
    const startTime = Date.now();

    // Step 1: STT — transcribe audio to text
    this.logger.log(`[STT] Starting transcription (${audioBuffer.length} bytes)... ${JSON.stringify(options)}`);
    const originalText = await this.sttAdapter.transcribeAudio(audioBuffer, {
      language: options.sourceLanguage,
      format: options.audioFormat,
    });
    this.logger.log(`[STT] Done in ${Date.now() - startTime}ms: "${originalText.substring(0, 100)}..."`);

    if (!originalText.trim()) {
      throw new Error('STT returned empty transcript. Audio may be silent or unrecognizable.');
    }

    // Step 2: LLM — translate text
    const translateStart = Date.now();
    const translatedText = await this.translateText(
      originalText,
      options.sourceLanguage,
      options.targetLanguage,
    );
    this.logger.log(`[LLM] Translation done in ${Date.now() - translateStart}ms - ${translatedText}`);

    // Step 3: TTS — synthesize translated text to audio
    const ttsStart = Date.now();
    const outputFormat = options.outputFormat || 'mp3';
    const audio = await this.ttsAdapter.synthesize(translatedText, {
      voiceId: options.voiceId,
      format: outputFormat,
    });
    this.logger.log(`[TTS] Synthesis done in ${Date.now() - ttsStart}ms (${audio.length} bytes)`);

    this.logger.log(`[Pipeline] Total: ${Date.now() - startTime}ms | STT: ${translateStart - startTime}ms | LLM: ${ttsStart - translateStart}ms | TTS: ${Date.now() - ttsStart}ms`);

    return {
      originalText,
      translatedText,
      audio,
      audioContentType: this.mapContentType(outputFormat),
    };
  }

  /**
   * Stream variant: returns TTS audio as AsyncIterable<Buffer>
   */
  async *translateStream(
    audioBuffer: Buffer,
    options: TranslateOptions,
  ): AsyncIterable<Buffer> {
    // Step 1: STT
    const originalText = await this.sttAdapter.transcribeAudio(audioBuffer, {
      language: options.sourceLanguage,
      format: options.audioFormat,
    });

    if (!originalText.trim()) {
      throw new Error('STT returned empty transcript.');
    }

    // Step 2: LLM translate
    const translatedText = await this.translateText(
      originalText,
      options.sourceLanguage,
      options.targetLanguage,
    );

    // Step 3: TTS stream
    yield* this.ttsAdapter.streamSynthesize(translatedText, {
      voiceId: options.voiceId,
      format: options.outputFormat || 'mp3',
    });
  }

  private async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    const prompt = this.buildTranslatePrompt(text, sourceLanguage, targetLanguage);
    const result = await this.llmAdapter.generate(prompt, {
      temperature: 0.3,
      maxTokens: 2048,
    });
    return result.trim();
  }

  private buildTranslatePrompt(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): string {
    return `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
Only output the translated text, nothing else. Do not add explanations or notes.

Text to translate:
${text}`;
  }

  private mapContentType(format: string): string {
    switch (format.toLowerCase()) {
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'opus':
        return 'audio/opus';
      case 'aac':
        return 'audio/aac';
      case 'flac':
        return 'audio/flac';
      default:
        return 'audio/mpeg';
    }
  }
}
