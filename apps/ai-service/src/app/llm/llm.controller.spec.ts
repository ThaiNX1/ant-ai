import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller';
import { LlmService } from '@ai-platform/ai-core';
import { firstValueFrom, toArray } from 'rxjs';

describe('LlmController', () => {
  let controller: LlmController;
  let llmService: jest.Mocked<LlmService>;

  beforeEach(async () => {
    const mockLlmService = {
      generate: jest.fn(),
      generateStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [
        { provide: LlmService, useValue: mockLlmService },
      ],
    }).compile();

    controller = module.get<LlmController>(LlmController);
    llmService = module.get(LlmService) as jest.Mocked<LlmService>;
  });

  describe('POST /llm/generate', () => {
    it('should return generated text result', async () => {
      llmService.generate.mockResolvedValue('Hello from LLM');

      const result = await controller.generate({ prompt: 'Say hello' });

      expect(result).toEqual({ result: 'Hello from LLM' });
      expect(llmService.generate).toHaveBeenCalledWith('Say hello', undefined);
    });

    it('should pass options to LlmService', async () => {
      llmService.generate.mockResolvedValue('Response');
      const options = { temperature: 0.7, maxTokens: 100 };

      const result = await controller.generate({ prompt: 'Test', options });

      expect(result).toEqual({ result: 'Response' });
      expect(llmService.generate).toHaveBeenCalledWith('Test', options);
    });

    it('should propagate errors from LlmService', async () => {
      llmService.generate.mockRejectedValue(new Error('API error'));

      await expect(controller.generate({ prompt: 'fail' })).rejects.toThrow('API error');
    });
  });

  describe('POST /llm/generate-stream', () => {
    it('should return SSE observable with streamed chunks', async () => {
      async function* mockStream() {
        yield 'chunk1';
        yield 'chunk2';
        yield 'chunk3';
      }
      llmService.generateStream.mockReturnValue(mockStream());

      const observable = controller.generateStream({ prompt: 'Stream test' });
      const events = await firstValueFrom(observable.pipe(toArray()));

      expect(events).toEqual([
        { data: 'chunk1' },
        { data: 'chunk2' },
        { data: 'chunk3' },
      ]);
      expect(llmService.generateStream).toHaveBeenCalledWith('Stream test', undefined);
    });

    it('should pass options to generateStream', async () => {
      async function* mockStream() {
        yield 'data';
      }
      llmService.generateStream.mockReturnValue(mockStream());
      const options = { temperature: 0.5 };

      const observable = controller.generateStream({ prompt: 'Test', options });
      await firstValueFrom(observable.pipe(toArray()));

      expect(llmService.generateStream).toHaveBeenCalledWith('Test', options);
    });

    it('should propagate stream errors through observable', async () => {
      async function* mockStream(): AsyncIterable<string> {
        throw new Error('Stream error');
      }
      llmService.generateStream.mockReturnValue(mockStream());

      const observable = controller.generateStream({ prompt: 'fail' });

      await expect(firstValueFrom(observable)).rejects.toThrow('Stream error');
    });
  });
});
