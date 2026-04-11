import { Test, TestingModule } from '@nestjs/testing';
import { SttController } from './stt.controller';
import { ISttAdapter, namedToken } from '@ai-platform/ai-core';

describe('SttController', () => {
  let controller: SttController;
  let whisper: jest.Mocked<ISttAdapter>;

  beforeEach(async () => {
    const mockAdapter: jest.Mocked<ISttAdapter> = {
      transcribeAudio: jest.fn(),
    } as unknown as jest.Mocked<ISttAdapter>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SttController],
      providers: [
        { provide: namedToken('STT', 'openai-whisper'), useValue: mockAdapter },
      ],
    }).compile();

    controller = module.get<SttController>(SttController);
    whisper = module.get(namedToken('STT', 'openai-whisper'));
  });

  describe('POST /stt/transcribe', () => {
    it('should return transcribed text from audio buffer', async () => {
      const audioBuffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      whisper.transcribeAudio.mockResolvedValue('Hello world');

      const result = await controller.transcribe(audioBuffer);

      expect(result).toEqual({ text: 'Hello world' });
      expect(whisper.transcribeAudio).toHaveBeenCalledWith(audioBuffer);
    });

    it('should handle empty transcription result', async () => {
      const audioBuffer = Buffer.from([0x00]);
      whisper.transcribeAudio.mockResolvedValue('');

      const result = await controller.transcribe(audioBuffer);

      expect(result).toEqual({ text: '' });
      expect(whisper.transcribeAudio).toHaveBeenCalledWith(audioBuffer);
    });

    it('should propagate errors from adapter', async () => {
      const audioBuffer = Buffer.from([0x01]);
      whisper.transcribeAudio.mockRejectedValue(new Error('STT API error'));

      await expect(controller.transcribe(audioBuffer)).rejects.toThrow('STT API error');
    });
  });
});
