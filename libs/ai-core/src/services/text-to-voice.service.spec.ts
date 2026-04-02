import { Test, TestingModule } from '@nestjs/testing';
import { TextToVoiceService } from './text-to-voice.service';
import { LLM_ADAPTER, TTS_ADAPTER } from '../constants/injection-tokens';
import { ILlmAdapter } from '../interfaces/llm.interface';
import { ITtsAdapter } from '../interfaces/tts.interface';

describe('TextToVoiceService', () => {
  let service: TextToVoiceService;
  let mockLlm: jest.Mocked<ILlmAdapter>;
  let mockTts: jest.Mocked<ITtsAdapter>;

  beforeEach(async () => {
    mockLlm = {
      generate: jest.fn(),
      generateStream: jest.fn(),
    };
    mockTts = {
      synthesize: jest.fn(),
      streamSynthesize: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextToVoiceService,
        { provide: LLM_ADAPTER, useValue: mockLlm },
        { provide: TTS_ADAPTER, useValue: mockTts },
      ],
    }).compile();

    service = module.get(TextToVoiceService);
  });

  describe('generateAndSynthesize', () => {
    it('should generate text from LLM then synthesize via TTS', async () => {
      const audioBuffer = Buffer.from('audio-data');
      mockLlm.generate.mockResolvedValue('Hello world');
      mockTts.synthesize.mockResolvedValue(audioBuffer);

      const result = await service.generateAndSynthesize('Say hello');

      expect(mockLlm.generate).toHaveBeenCalledWith('Say hello', undefined);
      expect(mockTts.synthesize).toHaveBeenCalledWith('Hello world', undefined);
      expect(result).toBe(audioBuffer);
    });

    it('should pass options to LLM and TTS', async () => {
      const audioBuffer = Buffer.from('audio');
      mockLlm.generate.mockResolvedValue('text');
      mockTts.synthesize.mockResolvedValue(audioBuffer);

      const llmOpts = { temperature: 0.5 };
      const ttsOpts = { voiceId: 'voice-1' };
      await service.generateAndSynthesize('prompt', llmOpts, ttsOpts);

      expect(mockLlm.generate).toHaveBeenCalledWith('prompt', llmOpts);
      expect(mockTts.synthesize).toHaveBeenCalledWith('text', ttsOpts);
    });
  });

  describe('generateAndStreamSynthesize', () => {
    it('should generate text then stream synthesize', async () => {
      mockLlm.generate.mockResolvedValue('Hello');
      const chunks = [Buffer.from('chunk1'), Buffer.from('chunk2')];
      mockTts.streamSynthesize.mockReturnValue(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
      );

      const result: Buffer[] = [];
      for await (const chunk of service.generateAndStreamSynthesize('prompt')) {
        result.push(chunk);
      }

      expect(mockLlm.generate).toHaveBeenCalledWith('prompt', undefined);
      expect(mockTts.streamSynthesize).toHaveBeenCalledWith('Hello', undefined);
      expect(result).toEqual(chunks);
    });
  });

  describe('streamGenerateAndSynthesize', () => {
    it('should stream generate then synthesize each chunk', async () => {
      const textChunks = ['Hello', ' world'];
      mockLlm.generateStream.mockReturnValue(
        (async function* () {
          for (const t of textChunks) yield t;
        })(),
      );

      const audio1 = Buffer.from('a1');
      const audio2 = Buffer.from('a2');
      mockTts.streamSynthesize
        .mockReturnValueOnce(
          (async function* () { yield audio1; })(),
        )
        .mockReturnValueOnce(
          (async function* () { yield audio2; })(),
        );

      const result: Buffer[] = [];
      for await (const chunk of service.streamGenerateAndSynthesize('prompt')) {
        result.push(chunk);
      }

      expect(mockLlm.generateStream).toHaveBeenCalledWith('prompt', undefined);
      expect(mockTts.streamSynthesize).toHaveBeenCalledTimes(2);
      expect(result).toEqual([audio1, audio2]);
    });
  });
});
