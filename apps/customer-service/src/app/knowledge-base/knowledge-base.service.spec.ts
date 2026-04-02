import { KnowledgeBaseService } from './knowledge-base.service';
import { LlmService } from '@ai-platform/ai-core';

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService;
  let llmService: LlmService;

  beforeEach(() => {
    llmService = {
      generate: jest.fn().mockResolvedValue('Đây là câu trả lời dựa trên tài liệu.'),
    } as unknown as LlmService;

    service = new KnowledgeBaseService(llmService);
  });

  it('should return an answer from LLM with RAG prompt', async () => {
    const result = await service.search({ query: 'Cách đổi mật khẩu?' });

    expect(result.answer).toBe('Đây là câu trả lời dựa trên tài liệu.');
    expect(result.sources).toBeDefined();
    expect(Array.isArray(result.sources)).toBe(true);
    expect(llmService.generate).toHaveBeenCalledWith(
      expect.stringContaining('Cách đổi mật khẩu?'),
    );
  });

  it('should include RAG context in prompt', async () => {
    await service.search({ query: 'test query' });

    expect(llmService.generate).toHaveBeenCalledWith(
      expect.stringContaining('Tài liệu:'),
    );
  });

  it('should return empty sources when no articles match', async () => {
    const result = await service.search({ query: 'xyz' });
    expect(result.sources).toEqual([]);
  });
});
