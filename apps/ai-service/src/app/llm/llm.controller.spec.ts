import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller';
import { ILlmAdapter, namedToken } from '@ai-platform/ai-core';
import { firstValueFrom, toArray } from 'rxjs';

describe('LlmController', () => {
  let controller: LlmController;
  let geminiFlash: jest.Mocked<ILlmAdapter>;

  beforeEach(async () => {
    const mockAdapter: jest.Mocked<ILlmAdapter> = {
      generate: jest.fn(),
      generateStream: jest.fn(),
    } as unknown as jest.Mocked<ILlmAdapter>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [
        { provide: namedToken('LLM', 'gemini-flash'), useValue: mockAdapter },
      ],
    }).compile();

    controller = module.get<LlmController>(LlmController);
    geminiFlash = module.get(namedToken('LLM', 'gemini-flash'));
  });

  describe('POST /llm/generate', () => {
    it('should return generated text result', async () => {
      geminiFlash.generate.mockResolvedValue('Hello from LLM');

      const result = await controller.generate({ prompt: 'Say hello' });

      expect(result).toEqual({ result: 'Hello from LLM' });
      expect(geminiFlash.generate).toHaveBeenCalledWith('Say hello', undefined);
    });

    it('should pass options to adapter', async () => {
      geminiFlash.generate.mockResolvedValue('Response');
      const options = { temperature: 0.7, maxTokens: 100 };

      const result = await controller.generate({ prompt: 'Test', options });

      expect(result).toEqual({ result: 'Response' });
      expect(geminiFlash.generate).toHaveBeenCalledWith('Test', options);
    });

    it('should propagate errors from adapter', async () => {
      geminiFlash.generate.mockRejectedValue(new Error('API error'));

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
      geminiFlash.generateStream.mockReturnValue(mockStream());

      const observable = controller.generateStream({ prompt: 'Stream test' });
      const events = await firstValueFrom(observable.pipe(toArray()));

      expect(events).toEqual([
        { data: 'chunk1' },
        { data: 'chunk2' },
        { data: 'chunk3' },
      ]);
      expect(geminiFlash.generateStream).toHaveBeenCalledWith('Stream test', undefined);
    });

    it('should pass options to generateStream', async () => {
      async function* mockStream() {
        yield 'data';
      }
      geminiFlash.generateStream.mockReturnValue(mockStream());
      const options = { temperature: 0.5 };

      const observable = controller.generateStream({ prompt: 'Test', options });
      await firstValueFrom(observable.pipe(toArray()));

      expect(geminiFlash.generateStream).toHaveBeenCalledWith('Test', options);
    });

    it('should propagate stream errors through observable', async () => {
      async function* mockStream(): AsyncIterable<string> {
        throw new Error('Stream error');
      }
      geminiFlash.generateStream.mockReturnValue(mockStream());

      const observable = controller.generateStream({ prompt: 'fail' });

      await expect(firstValueFrom(observable)).rejects.toThrow('Stream error');
    });
  });
});
