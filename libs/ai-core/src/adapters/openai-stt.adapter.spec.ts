import { OpenAiSttAdapter } from './openai-stt.adapter';
import { AdapterError } from '../errors/adapter.error';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';

// Mock openai
const mockCreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: mockCreate,
      },
    },
  })),
}));

describe('OpenAiSttAdapter', () => {
  const config: AdapterConfig = {
    provider: 'openai',
    model: 'whisper-1',
    apiKey: 'test-key',
  };
  let adapter: OpenAiSttAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new OpenAiSttAdapter(config);
  });

  describe('transcribeAudio', () => {
    it('should return transcribed text', async () => {
      mockCreate.mockResolvedValue('Hello world');
      const result = await adapter.transcribeAudio(Buffer.from('audio-data'));
      expect(result).toBe('Hello world');
    });

    it('should throw AdapterError on API failure', async () => {
      mockCreate.mockRejectedValue(
        Object.assign(new Error('Invalid audio'), { status: 400 }),
      );

      await expect(
        adapter.transcribeAudio(Buffer.from('bad-audio')),
      ).rejects.toThrow(AdapterError);
      await expect(
        adapter.transcribeAudio(Buffer.from('bad-audio')),
      ).rejects.toMatchObject({
        code: '400',
        message: 'Invalid audio',
        provider: 'openai',
      });
    });
  });
});
