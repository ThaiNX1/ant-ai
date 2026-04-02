import {
  GoogleGenerativeAI,
  GenerativeModel,
} from '@google/generative-ai';
import { ILlmAdapter } from '../interfaces/llm.interface';
import { LlmOptions } from '../interfaces/llm-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

/**
 * Gemini LLM Adapter — uses @google/generative-ai SDK.
 */
export class GeminiLlmAdapter implements ILlmAdapter {
  private readonly client: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private readonly config: AdapterConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({ model: config.model });
  }

  async generate(prompt: string, options?: LlmOptions): Promise<string> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
      });
      return result.response.text();
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  async *generateStream(
    prompt: string,
    options?: LlmOptions,
  ): AsyncIterable<string> {
    try {
      const result = await this.model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
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
      error instanceof Error ? error.message : 'Unknown Gemini error';
    const code =
      (error as { status?: number })?.status?.toString() ?? 'GEMINI_ERROR';
    return new AdapterError(code, message, 'gemini');
  }
}
