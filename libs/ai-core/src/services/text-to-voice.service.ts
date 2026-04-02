import { Inject, Injectable } from '@nestjs/common';
import { LLM_ADAPTER, TTS_ADAPTER } from '../constants/injection-tokens';
import { ILlmAdapter } from '../interfaces/llm.interface';
import { ITtsAdapter } from '../interfaces/tts.interface';
import { LlmOptions } from '../interfaces/llm-options.interface';
import { TtsOptions } from '../interfaces/tts-options.interface';

@Injectable()
export class TextToVoiceService {
  constructor(
    @Inject(LLM_ADAPTER)
    private readonly llmAdapter: ILlmAdapter,
    @Inject(TTS_ADAPTER)
    private readonly ttsAdapter: ITtsAdapter,
  ) {}

  async generateAndSynthesize(
    prompt: string,
    llmOptions?: LlmOptions,
    ttsOptions?: TtsOptions,
  ): Promise<Buffer> {
    const text = await this.llmAdapter.generate(prompt, llmOptions);
    return this.ttsAdapter.synthesize(text, ttsOptions);
  }

  async *generateAndStreamSynthesize(
    prompt: string,
    llmOptions?: LlmOptions,
    ttsOptions?: TtsOptions,
  ): AsyncIterable<Buffer> {
    const text = await this.llmAdapter.generate(prompt, llmOptions);
    yield* this.ttsAdapter.streamSynthesize(text, ttsOptions);
  }

  async *streamGenerateAndSynthesize(
    prompt: string,
    llmOptions?: LlmOptions,
    ttsOptions?: TtsOptions,
  ): AsyncIterable<Buffer> {
    for await (const chunk of this.llmAdapter.generateStream(prompt, llmOptions)) {
      yield* this.ttsAdapter.streamSynthesize(chunk, ttsOptions);
    }
  }
}
