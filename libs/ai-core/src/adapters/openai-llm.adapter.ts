import { OpenAI } from 'openai';
import { ILlmAdapter } from '../interfaces/llm.interface';
import { LlmOptions } from '../interfaces/llm-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

/**
 * OpenAI LLM Adapter — uses the openai SDK (ChatCompletion).
 */
export class OpenAiLlmAdapter implements ILlmAdapter {
  private readonly client: OpenAI;
  private readonly modelName: string;

  constructor(private readonly config: AdapterConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.modelName = config.model;
  }

  async generate(prompt: string, options?: LlmOptions): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stop: options?.stopSequences,
      });

      return response.choices[0]?.message?.content ?? '';
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  async *generateStream(
    prompt: string,
    options?: LlmOptions,
  ): AsyncIterable<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stop: options?.stopSequences,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          yield text;
        }
      }
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  private wrapError(error: unknown): AdapterError {
    const message =
      error instanceof Error ? error.message : 'Unknown OpenAI LLM error';
    const code =
      (error as { status?: number })?.status?.toString() ?? 'OPENAI_LLM_ERROR';
    return new AdapterError(code, message, 'openai');
  }
}
