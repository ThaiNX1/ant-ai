import { LlmOptions } from './llm-options.interface';

export interface ILlmAdapter {
  generate(prompt: string, options?: LlmOptions): Promise<string>;
  generateStream(prompt: string, options?: LlmOptions): AsyncIterable<string>;
}
