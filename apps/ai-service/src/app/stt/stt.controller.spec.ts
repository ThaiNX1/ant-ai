import { Test, TestingModule } from '@nestjs/testing';
import { SttController } from './stt.controller';
import { SttService } from '@ai-platform/ai-core';

describe('SttController', () => {
  let controller: SttController;
  let sttService: jest.Mocked<SttService>;

  beforeEach(async () => {
    const mockSttService = {
      transcribeAudio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SttController],
      providers: [
        { provide: SttService, useValue: mockSttService },
      ],
    }).compile();

    controller = module.get<SttController>(SttController);
    sttService = module.get(SttService) as jest.Mocked<SttService>;
  });

  describe('POST /stt/transcribe', () => {
    it('should return transcribed text from audio buffer', async () => {
      const audioBuffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      sttService.transcribeAudio.mockResolvedValue('Hello world');

      const result = await controller.transcribe(audioBuffer);

      expect(result).toEqual({ text: 'Hello world' });
      expect(sttService.transcribeAudio).toHaveBeenCalledWith(audioBuffer);
    });

    it('should handle empty transcription result', async () => {
      const audioBuffer = Buffer.from([0x00]);
      sttService.transcribeAudio.mockResolvedValue('');

      const result = await controller.transcribe(audioBuffer);

      expect(result).toEqual({ text: '' });
      expect(sttService.transcribeAudio).toHaveBeenCalledWith(audioBuffer);
    });

    it('should propagate errors from SttService', async () => {
      const audioBuffer = Buffer.from([0x01]);
      sttService.transcribeAudio.mockRejectedValue(new Error('STT API error'));

      await expect(controller.transcribe(audioBuffer)).rejects.toThrow('STT API error');
    });
  });
});
