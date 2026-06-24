import { OpenAI } from 'openai';
import { QwenFlashLlmAdapter } from './qwen-flash-llm.adapter';
import { AdapterError } from '../errors/adapter.error';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

const mockCreate = jest.fn();

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

describe('QwenFlashLlmAdapter', () => {
  const config: AdapterConfig = {
    provider: 'qwen',
    model: 'qwen3.5-flash',
    apiKey: 'test-key',
    baseUrl: 'https://example.test/compatible-mode/v1',
  };
  let adapter: QwenFlashLlmAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new QwenFlashLlmAdapter(config);
  });

  describe('constructor', () => {
    it('should configure the OpenAI-compatible client', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        baseURL: 'https://example.test/compatible-mode/v1',
      });
    });
  });

  describe('generate', () => {
    it('should return generated text', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello world' } }],
      });

      const result = await adapter.generate('Say hello');

      expect(result).toBe('Hello world');
    });

    it('should pass model and options to chat completions', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'ok' } }],
      });

      await adapter.generate('test', { temperature: 0.7, maxTokens: 100 });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'qwen3.5-flash',
        messages: [{ role: 'user', content: 'test' }],
        temperature: 0.7,
        max_tokens: 100,
        top_p: undefined,
        stop: undefined,
      });
    });

    it('should throw AdapterError on API failure', async () => {
      mockCreate.mockRejectedValue(
        Object.assign(new Error('Qwen rate limit'), { status: 429 }),
      );

      await expect(adapter.generate('test')).rejects.toThrow(AdapterError);
      await expect(adapter.generate('test')).rejects.toMatchObject({
        code: '429',
        message: 'Qwen rate limit',
        provider: 'qwen',
      });
    });
  });

  describe('generateStream', () => {
    it('should yield text chunks', async () => {
      mockCreate.mockResolvedValue(
        (async function* () {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: ' world' } }] };
        })(),
      );

      const results: string[] = [];
      for await (const chunk of adapter.generateStream('Say hello')) {
        results.push(chunk);
      }

      expect(results).toEqual(['Hello', ' world']);
    });
  });
});
