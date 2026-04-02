import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService, SearchResult } from './knowledge-base.service';

describe('KnowledgeBaseController', () => {
  let controller: KnowledgeBaseController;
  let service: KnowledgeBaseService;

  const mockResult: SearchResult = {
    answer: 'Answer from KB',
    sources: [],
  };

  beforeEach(() => {
    service = {
      search: jest.fn().mockResolvedValue(mockResult),
    } as unknown as KnowledgeBaseService;

    controller = new KnowledgeBaseController(service);
  });

  it('should search knowledge base and return result', async () => {
    const result = await controller.search({ query: 'How to reset?' });
    expect(result).toEqual(mockResult);
    expect(service.search).toHaveBeenCalledWith({ query: 'How to reset?' });
  });
});
