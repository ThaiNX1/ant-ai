import { Test, TestingModule } from '@nestjs/testing';
import { TtsController } from './tts.controller';
import { TtsService } from '@ai-platform/ai-core';
import { FastifyReply } from 'fastify';

describe('TtsController', () => {
  let controller: TtsController;
  let ttsService: jest.Mocked<TtsService>;

  function createMockReply(): FastifyReply {
    const chunks: Buffer[] = [];
    const raw = {
      writeHead: jest.fn(),
      write: jest.fn((chunk: Buffer) => chunks.push(chunk)),
      end: jest.fn(),
      _chunks: chunks,
    };
    return { raw } as unknown as FastifyReply;
  }

  beforeEach(async () => {
    const mockTtsService = {
      synthesize: jest.fn(),
      streamSynthesize: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TtsController],
      providers: [
        { provide: TtsService, useValue: mockTtsService },
      ],
    }).compile();

    controller = module.get<TtsController>(TtsController);
    ttsService = module.get(TtsService) as jest.Mocked<TtsService>;
  });

  describe('POST /tts/synthesize-stream', () => {
    it('should stream audio chunks via chunked response', async () => {
      const chunk1 = Buffer.from([0x01, 0x02]);
      const chunk2 = Buffer.from([0x03, 0x04]);

      async function* mockStream() {
        yield chunk1;
        yield chunk2;
      }
      ttsService.streamSynthesize.mockReturnValue(mockStream());

      const reply = createMockReply();
      await controller.synthesizeStream({ text: 'Hello world' }, reply);

      expect(reply.raw.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      });
      expect(reply.raw.write).toHaveBeenCalledTimes(2);
      expect(reply.raw.write).toHaveBeenNthCalledWith(1, chunk1);
      expect(reply.raw.write).toHaveBeenNthCalledWith(2, chunk2);
      expect(reply.raw.end).toHaveBeenCalled();
      expect(ttsService.streamSynthesize).toHaveBeenCalledWith('Hello world', undefined);
    });

    it('should pass voiceId as TTS option', async () => {
      async function* mockStream() {
        yield Buffer.from([0x00]);
      }
      ttsService.streamSynthesize.mockReturnValue(mockStream());

      const reply = createMockReply();
      await controller.synthesizeStream(
        { text: 'Test', voiceId: 'voice-123' },
        reply,
      );

      expect(ttsService.streamSynthesize).toHaveBeenCalledWith('Test', {
        voiceId: 'voice-123',
      });
      expect(reply.raw.end).toHaveBeenCalled();
    });

    it('should merge voiceId and options', async () => {
      async function* mockStream() {
        yield Buffer.from([0x00]);
      }
      ttsService.streamSynthesize.mockReturnValue(mockStream());

      const reply = createMockReply();
      await controller.synthesizeStream(
        { text: 'Test', voiceId: 'voice-456', options: { speed: 1.5 } },
        reply,
      );

      expect(ttsService.streamSynthesize).toHaveBeenCalledWith('Test', {
        speed: 1.5,
        voiceId: 'voice-456',
      });
    });

    it('should pass options without voiceId', async () => {
      async function* mockStream() {
        yield Buffer.from([0x00]);
      }
      ttsService.streamSynthesize.mockReturnValue(mockStream());

      const reply = createMockReply();
      await controller.synthesizeStream(
        { text: 'Test', options: { format: 'mp3' } },
        reply,
      );

      expect(ttsService.streamSynthesize).toHaveBeenCalledWith('Test', {
        format: 'mp3',
      });
    });

    it('should propagate errors from TtsService', async () => {
      async function* mockStream(): AsyncIterable<Buffer> {
        throw new Error('TTS API error');
      }
      ttsService.streamSynthesize.mockReturnValue(mockStream());

      const reply = createMockReply();
      await expect(
        controller.synthesizeStream({ text: 'fail' }, reply),
      ).rejects.toThrow('TTS API error');
    });
  });
});
