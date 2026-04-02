import { GoogleGenAI } from '@google/genai';
import { ILlmAdapter } from '../interfaces/llm.interface';
import { LlmOptions } from '../interfaces/llm-options.interface';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

/**
 * Gemini LLM Adapter — uses the unified @google/genai SDK.
 */
export class GeminiLlmAdapter implements ILlmAdapter {
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor(private readonly config: AdapterConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.modelName = config.model;
  }

  async generate(prompt: string, options?: LlmOptions): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
      });
      return response.text ?? '';
    } catch (error: unknown) {
      throw this.wrapError(error);
    }
  }

  async *generateStream(
    prompt: string,
    options?: LlmOptions,
  ): AsyncIterable<string> {
    try {
      const response = await this.ai.models.generateContentStream({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
      });

      for await (const chunk of response) {
        const text = chunk.text;
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
