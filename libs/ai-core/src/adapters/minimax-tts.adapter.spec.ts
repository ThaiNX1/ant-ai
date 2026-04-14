import axios from 'axios';
import { MinimaxTtsAdapter } from './minimax-tts.adapter';
import { AdapterConfig } from '../interfaces/ai-core-options.interface';
import { AdapterError } from '../errors/adapter.error';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockConfig: AdapterConfig = {
  provider: 'minimax',
  apiKey: 'test-api-key',
  model: 'speech-02-turbo',
};

const FAKE_HEX = Buffer.from('fake-audio').toString('hex');

describe('MinimaxTtsAdapter', () => {
  let adapter: MinimaxTtsAdapter;

  beforeEach(() => {
    adapter = new MinimaxTtsAdapter(mockConfig);
    jest.clearAllMocks();
  });

  describe('synthesize', () => {
    it('should return a Buffer decoded from hex audio on success', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: { audio: FAKE_HEX, status: 2 },
          trace_id: 'trace-1',
          base_resp: { status_code: 0, status_msg: 'Success' },
        },
      });

      const result = await adapter.synthesize('Hello world');

      expect(result).toBeInstanceOf(Buffer);
      expect(result).toEqual(Buffer.from('fake-audio'));
    });

    it('should send correct voice_setting and audio_setting from options', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: { audio: FAKE_HEX, status: 2 },
          trace_id: 'trace-2',
          base_resp: { status_code: 0, status_msg: 'Success' },
        },
      });

      await adapter.synthesize('Test', {
        voiceId: 'custom-voice',
        speed: 1.2,
        pitch: 2,
        format: 'pcm',
        volume: 0.8,
        sampleRate: 44100,
      });

      const body = mockedAxios.post.mock.calls[0][1] as Record<string, unknown>;
      expect((body['voice_setting'] as Record<string, unknown>)['voice_id']).toBe('custom-voice');
      expect((body['voice_setting'] as Record<string, unknown>)['speed']).toBe(1.2);
      expect((body['voice_setting'] as Record<string, unknown>)['pitch']).toBe(2);
      expect((body['voice_setting'] as Record<string, unknown>)['vol']).toBe(0.8);
      expect((body['audio_setting'] as Record<string, unknown>)['format']).toBe('pcm');
      expect((body['audio_setting'] as Record<string, unknown>)['sample_rate']).toBe(44100);
    });

    it('should use default voice and model when options are omitted', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: { audio: FAKE_HEX, status: 2 },
          trace_id: 'trace-3',
          base_resp: { status_code: 0, status_msg: 'Success' },
        },
      });

      await adapter.synthesize('Hello');

      const body = mockedAxios.post.mock.calls[0][1] as Record<string, unknown>;
      expect(body['model']).toBe('speech-02-turbo');
      expect((body['voice_setting'] as Record<string, unknown>)['voice_id']).toBe(
        'male-qn-qingse',
      );
    });

    it('should throw AdapterError on HTTP 401', async () => {
      const axiosError = Object.assign(new Error('Unauthorized'), {
        isAxiosError: true,
        response: { status: 401, data: { message: 'Unauthorized' } },
      });
      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(adapter.synthesize('Hello')).rejects.toMatchObject({
        code: 'HTTP_401',
        provider: 'minimax',
      });
    });

    it('should throw AdapterError when base_resp status_code is non-zero', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: null,
          trace_id: 'trace-4',
          base_resp: { status_code: 1002, status_msg: 'Invalid API key' },
        },
      });

      await expect(adapter.synthesize('Hello')).rejects.toMatchObject({
        code: 'MINIMAX_1002',
        provider: 'minimax',
      });
    });

    it('should throw AdapterError when audio data is empty', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: { audio: '', status: 2 },
          trace_id: 'trace-5',
          base_resp: { status_code: 0, status_msg: 'Success' },
        },
      });

      await expect(adapter.synthesize('Hello')).rejects.toMatchObject({
        code: 'EMPTY_AUDIO',
        provider: 'minimax',
      });
    });

    it('should throw AdapterError on network failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(adapter.synthesize('Hello')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        provider: 'minimax',
      });
    });
  });
});
