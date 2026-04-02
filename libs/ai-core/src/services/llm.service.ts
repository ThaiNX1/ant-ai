import { Inject, Injectable } from '@nestjs/common';
import { LLM_ADAPTER } from '../constants/injection-tokens';
import { ILlmAdapter } from '../interfaces/llm.interface';
import { LlmOptions } from '../interfaces/llm-options.interface';

@Injectable()
export class LlmService {
  constructor(
    @Inject(LLM_ADAPTER) private readonly llmAdapter: ILlmAdapter,
  ) {}

  async generate(prompt: string, options?: LlmOptions): Promise<string> {
    return this.llmAdapter.generate(prompt, options);
  }

  generateStream(prompt: string, options?: LlmOptions): AsyncIterable<string> {
    return this.llmAdapter.generateStream(prompt, options);
  }
}
