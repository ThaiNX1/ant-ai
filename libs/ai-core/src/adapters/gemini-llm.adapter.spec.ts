import { GeminiLlmAdapter } from './gemini-llm.adapter';
import { AdapterError } from '../errors/adapter.error';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

// Mock @google/genai
const mockGenerateContent = jest.fn();
const mockGenerateContentStream = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream,
    },
  })),
}));

describe('GeminiLlmAdapter', () => {
  const config: AdapterConfig = {
    provider: 'gemini',
    model: 'gemini-pro',
    apiKey: 'test-key',
  };
  let adapter: GeminiLlmAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new GeminiLlmAdapter(config);
  });

  describe('generate', () => {
    it('should return generated text', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Hello world' });
      const result = await adapter.generate('Say hello');
      expect(result).toBe('Hello world');
    });

    it('should pass model and config to SDK', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'ok' });
      await adapter.generate('test', { temperature: 0.7, maxTokens: 100 });

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-pro',
        contents: 'test',
        config: {
          temperature: 0.7,
          maxOutputTokens: 100,
          topP: undefined,
          stopSequences: undefined,
        },
      });
    });

    it('should return empty string when text is null', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });
      const result = await adapter.generate('test');
      expect(result).toBe('');
    });

    it('should throw AdapterError on API failure', async () => {
      mockGenerateContent.mockRejectedValue(
        Object.assign(new Error('API rate limit'), { status: 429 }),
      );
      await expect(adapter.generate('test')).rejects.toThrow(AdapterError);
      await expect(adapter.generate('test')).rejects.toMatchObject({
        code: '429',
        message: 'API rate limit',
        provider: 'gemini',
      });
    });
  });

  describe('generateStream', () => {
    it('should yield text chunks', async () => {
      mockGenerateContentStream.mockResolvedValue(
        (async function* () {
          yield { text: 'Hello' };
          yield { text: ' world' };
        })(),
      );

      const results: string[] = [];
      for await (const chunk of adapter.generateStream('Say hello')) {
        results.push(chunk);
      }
      expect(results).toEqual(['Hello', ' world']);
    });

    it('should skip empty text chunks', async () => {
      mockGenerateContentStream.mockResolvedValue(
        (async function* () {
          yield { text: 'Hello' };
          yield { text: '' };
          yield { text: ' world' };
        })(),
      );

      const results: string[] = [];
      for await (const chunk of adapter.generateStream('test')) {
        results.push(chunk);
      }
      expect(results).toEqual(['Hello', ' world']);
    });

    it('should throw AdapterError on stream failure', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('Stream error'));
      const gen = adapter.generateStream('test');
      await expect(gen[Symbol.asyncIterator]().next()).rejects.toThrow(
        AdapterError,
      );
    });
  });
});
