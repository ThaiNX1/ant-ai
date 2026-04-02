import { ElevenLabsTtsAdapter } from './elevenlabs-tts.adapter';
import { AdapterError } from '../errors/adapter.error';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { Readable } from 'stream';

// Mock elevenlabs
jest.mock('elevenlabs', () => {
  const mockConvert = jest.fn();
  const mockConvertAsStream = jest.fn();
  return {
    ElevenLabsClient: jest.fn().mockImplementation(() => ({
      textToSpeech: {
        convert: mockConvert,
        convertAsStream: mockConvertAsStream,
      },
    })),
    __mockConvert: mockConvert,
    __mockConvertAsStream: mockConvertAsStream,
  };
});

const { __mockConvert: mockConvert, __mockConvertAsStream: mockConvertAsStream } =
  jest.requireMock('elevenlabs');

describe('ElevenLabsTtsAdapter', () => {
  const config: AdapterConfig = {
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    apiKey: 'test-key',
  };
  let adapter: ElevenLabsTtsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ElevenLabsTtsAdapter(config);
  });

  describe('synthesize', () => {
    it('should return audio buffer', async () => {
      const audioData = Buffer.from('fake-audio');
      const stream = Readable.from([audioData]);
      mockConvert.mockResolvedValue(stream);

      const result = await adapter.synthesize('Hello');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('fake-audio');
    });

    it('should throw AdapterError on API failure', async () => {
      mockConvert.mockRejectedValue(
        Object.assign(new Error('Unauthorized'), { statusCode: 401 }),
      );
      await expect(adapter.synthesize('test')).rejects.toThrow(AdapterError);
      await expect(adapter.synthesize('test')).rejects.toMatchObject({
        code: '401',
        message: 'Unauthorized',
        provider: 'elevenlabs',
      });
    });
  });

  describe('streamSynthesize', () => {
    it('should yield audio chunks', async () => {
      const chunks = [Buffer.from('chunk1'), Buffer.from('chunk2')];
      const stream = Readable.from(chunks);
      mockConvertAsStream.mockResolvedValue(stream);

      const results: Buffer[] = [];
      for await (const chunk of adapter.streamSynthesize('Hello')) {
        results.push(chunk);
      }
      expect(results).toHaveLength(2);
      expect(results[0].toString()).toBe('chunk1');
    });

    it('should throw AdapterError on stream failure', async () => {
      mockConvertAsStream.mockRejectedValue(new Error('Stream error'));
      const gen = adapter.streamSynthesize('test');
      await expect(gen[Symbol.asyncIterator]().next()).rejects.toThrow(
        AdapterError,
      );
    });
  });
});
