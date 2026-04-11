import { GoogleTtsAdapter } from './google-tts.adapter';
import { AdapterError } from '../errors/adapter.error';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

const mockSynthesizeSpeech = jest.fn();
const mockStreamingSynthesize = jest.fn();

jest.mock('@google-cloud/text-to-speech', () => ({
  TextToSpeechClient: jest.fn().mockImplementation(() => ({
    synthesizeSpeech: mockSynthesizeSpeech,
    streamingSynthesize: mockStreamingSynthesize,
  })),
}));

describe('GoogleTtsAdapter', () => {
  const config: AdapterConfig = {
    provider: 'google-tts',
    model: 'en-US-Studio-O',
    apiKey: 'test-key',
  };
  let adapter: GoogleTtsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new GoogleTtsAdapter(config);
  });

  describe('synthesize', () => {
    it('should return audio buffer', async () => {
      const audioContent = new Uint8Array([0x66, 0x61, 0x6b, 0x65]);
      mockSynthesizeSpeech.mockResolvedValue([{ audioContent }]);

      const result = await adapter.synthesize('Hello');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { text: 'Hello' },
          voice: expect.objectContaining({
            name: 'en-US-Studio-O',
            languageCode: 'en-US',
          }),
        }),
      );
    });

    it('should use custom voiceId and languageCode from options', async () => {
      const audioContent = new Uint8Array([0x01]);
      mockSynthesizeSpeech.mockResolvedValue([{ audioContent }]);

      await adapter.synthesize('Hi', {
        voiceId: 'vi-VN-Standard-A',
        languageCode: 'vi-VN',
      });

      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          voice: expect.objectContaining({
            name: 'vi-VN-Standard-A',
            languageCode: 'vi-VN',
          }),
        }),
      );
    });

    it('should extract languageCode from voiceId when not provided', async () => {
      const audioContent = new Uint8Array([0x01]);
      mockSynthesizeSpeech.mockResolvedValue([{ audioContent }]);

      await adapter.synthesize('Hi', { voiceId: 'ja-JP-Neural2-B' });

      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          voice: expect.objectContaining({
            name: 'ja-JP-Neural2-B',
            languageCode: 'ja-JP',
          }),
        }),
      );
    });

    it('should throw AdapterError when audioContent is empty', async () => {
      mockSynthesizeSpeech.mockResolvedValue([{ audioContent: null }]);

      await expect(adapter.synthesize('test')).rejects.toThrow(AdapterError);
      await expect(adapter.synthesize('test')).rejects.toMatchObject({
        provider: 'google-tts',
      });
    });

    it('should throw AdapterError on API failure', async () => {
      mockSynthesizeSpeech.mockRejectedValue(
        Object.assign(new Error('Permission denied'), { code: 7 }),
      );

      await expect(adapter.synthesize('test')).rejects.toThrow(AdapterError);
      await expect(adapter.synthesize('test')).rejects.toMatchObject({
        code: '7',
        message: 'Permission denied',
        provider: 'google-tts',
      });
    });

    it('should map audio format correctly', async () => {
      const audioContent = new Uint8Array([0x01]);
      mockSynthesizeSpeech.mockResolvedValue([{ audioContent }]);

      await adapter.synthesize('Hi', { format: 'ogg_opus' });

      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          audioConfig: expect.objectContaining({
            audioEncoding: 'OGG_OPUS',
          }),
        }),
      );
    });
  });

  describe('streamSynthesize', () => {
    it('should yield audio chunks from bidirectional stream', async () => {
      const chunks = [
        { audioContent: new Uint8Array([0x01, 0x02]) },
        { audioContent: new Uint8Array([0x03, 0x04]) },
      ];

      const mockWrite = jest.fn();
      const mockEnd = jest.fn();

      async function* fakeStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const stream = Object.assign(fakeStream(), {
        write: mockWrite,
        end: mockEnd,
      });
      mockStreamingSynthesize.mockReturnValue(stream);

      const results: Buffer[] = [];
      for await (const chunk of adapter.streamSynthesize('Hello')) {
        results.push(chunk);
      }
      expect(results).toHaveLength(2);
      expect(Buffer.isBuffer(results[0])).toBe(true);
      expect(mockWrite).toHaveBeenCalledTimes(2);
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('should skip chunks with no audioContent', async () => {
      const mockWrite = jest.fn();
      const mockEnd = jest.fn();

      async function* fakeStream() {
        yield { audioContent: new Uint8Array([0x01]) };
        yield { audioContent: null };
        yield { audioContent: new Uint8Array([0x02]) };
      }

      const stream = Object.assign(fakeStream(), {
        write: mockWrite,
        end: mockEnd,
      });
      mockStreamingSynthesize.mockReturnValue(stream);

      const results: Buffer[] = [];
      for await (const chunk of adapter.streamSynthesize('Hello')) {
        results.push(chunk);
      }
      expect(results).toHaveLength(2);
    });

    it('should throw AdapterError on stream failure', async () => {
      mockStreamingSynthesize.mockImplementation(() => {
        throw new Error('Stream error');
      });

      const gen = adapter.streamSynthesize('test');
      await expect(gen[Symbol.asyncIterator]().next()).rejects.toThrow(
        AdapterError,
      );
    });
  });
});
