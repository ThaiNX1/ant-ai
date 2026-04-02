import { Test, TestingModule } from '@nestjs/testing';
import { VoiceToVoiceService } from './voice-to-voice.service';
import { REALTIME_ADAPTER, TTS_ADAPTER } from '../constants/injection-tokens';
import { IRealtimeAdapter } from '../interfaces/realtime.interface';
import { ITtsAdapter } from '../interfaces/tts.interface';

describe('VoiceToVoiceService', () => {
  let service: VoiceToVoiceService;
  let mockRealtime: jest.Mocked<IRealtimeAdapter>;
  let mockTts: jest.Mocked<ITtsAdapter>;

  beforeEach(async () => {
    mockRealtime = {
      connect: jest.fn(),
      feedAudio: jest.fn(),
      getResponseStream: jest.fn(),
      disconnect: jest.fn(),
    };
    mockTts = {
      synthesize: jest.fn(),
      streamSynthesize: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceToVoiceService,
        { provide: REALTIME_ADAPTER, useValue: mockRealtime },
        { provide: TTS_ADAPTER, useValue: mockTts },
      ],
    }).compile();

    service = module.get(VoiceToVoiceService);
  });

  describe('connect', () => {
    it('should delegate to realtime adapter', async () => {
      mockRealtime.connect.mockResolvedValue(undefined);
      const config = { model: 'gpt-4o', voice: 'alloy' };

      await service.connect(config);

      expect(mockRealtime.connect).toHaveBeenCalledWith(config);
    });
  });

  describe('feedAudio', () => {
    it('should delegate to realtime adapter', () => {
      const audio = Buffer.from('audio');
      service.feedAudio(audio);
      expect(mockRealtime.feedAudio).toHaveBeenCalledWith(audio);
    });
  });

  describe('getResponseStream', () => {
    it('should delegate to realtime adapter', () => {
      const stream = (async function* () {
        yield { type: 'transcript', data: 'hello' };
      })();
      mockRealtime.getResponseStream.mockReturnValue(stream);

      const result = service.getResponseStream();
      expect(result).toBe(stream);
    });
  });

  describe('disconnect', () => {
    it('should delegate to realtime adapter', async () => {
      mockRealtime.disconnect.mockResolvedValue(undefined);
      await service.disconnect();
      expect(mockRealtime.disconnect).toHaveBeenCalled();
    });
  });

  describe('processVoicePipeline', () => {
    it('should feed audio and synthesize transcript responses', async () => {
      const audioInput = Buffer.from('input-audio');
      const audioOutput = Buffer.from('output-audio');

      mockRealtime.getResponseStream.mockReturnValue(
        (async function* () {
          yield { type: 'transcript', data: 'Hello there' };
        })(),
      );
      mockTts.streamSynthesize.mockReturnValue(
        (async function* () {
          yield audioOutput;
        })(),
      );

      const result: Buffer[] = [];
      for await (const chunk of service.processVoicePipeline(audioInput)) {
        result.push(chunk);
      }

      expect(mockRealtime.feedAudio).toHaveBeenCalledWith(audioInput);
      expect(mockTts.streamSynthesize).toHaveBeenCalledWith('Hello there', undefined);
      expect(result).toEqual([audioOutput]);
    });

    it('should skip non-transcript responses', async () => {
      const audioInput = Buffer.from('input');

      mockRealtime.getResponseStream.mockReturnValue(
        (async function* () {
          yield { type: 'audio', data: Buffer.from('raw-audio') };
          yield { type: 'status', data: 'done' };
        })(),
      );

      const result: Buffer[] = [];
      for await (const chunk of service.processVoicePipeline(audioInput)) {
        result.push(chunk);
      }

      expect(mockTts.streamSynthesize).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should pass ttsOptions to streamSynthesize', async () => {
      const audioInput = Buffer.from('input');
      const ttsOpts = { voiceId: 'voice-1' };

      mockRealtime.getResponseStream.mockReturnValue(
        (async function* () {
          yield { type: 'transcript', data: 'text' };
        })(),
      );
      mockTts.streamSynthesize.mockReturnValue(
        (async function* () {
          yield Buffer.from('out');
        })(),
      );

      const result: Buffer[] = [];
      for await (const chunk of service.processVoicePipeline(audioInput, ttsOpts)) {
        result.push(chunk);
      }

      expect(mockTts.streamSynthesize).toHaveBeenCalledWith('text', ttsOpts);
    });
  });
});
