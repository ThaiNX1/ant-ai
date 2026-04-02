import { GeminiLlmAdapter } from './gemini-llm.adapter';
import { AdapterError } from '../errors/adapter.error';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  const mockGenerateContentStream = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      }),
    })),
    __mockGenerateContent: mockGenerateContent,
    __mockGenerateContentStream: mockGenerateContentStream,
  };
});

const {
  __mockGenerateContent: mockGenerateContent,
  __mockGenerateContentStream: mockGenerateContentStream,
} = jest.requireMock('@google/generative-ai');

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
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'Hello world' },
      });
      const result = await adapter.generate('Say hello');
      expect(result).toBe('Hello world');
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
      const chunks = [{ text: () => 'Hello' }, { text: () => ' world' }];
      mockGenerateContentStream.mockResolvedValue({
        stream: (async function* () {
          for (const c of chunks) yield c;
        })(),
      });

      const results: string[] = [];
      for await (const chunk of adapter.generateStream('Say hello')) {
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
