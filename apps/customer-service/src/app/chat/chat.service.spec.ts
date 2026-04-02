import { ChatService } from './chat.service';
import { LlmService } from '@ai-platform/ai-core';

describe('ChatService', () => {
  let service: ChatService;
  let llmService: LlmService;

  beforeEach(() => {
    llmService = {
      generate: jest.fn().mockResolvedValue('Xin chào, tôi có thể giúp gì?'),
    } as unknown as LlmService;

    service = new ChatService(llmService);
  });

  it('should return a reply from LLM', async () => {
    const result = await service.sendMessage({
      message: 'Tôi cần hỗ trợ',
    });

    expect(result.reply).toBe('Xin chào, tôi có thể giúp gì?');
    expect(result.sessionId).toBe('default');
    expect(llmService.generate).toHaveBeenCalledWith(
      expect.stringContaining('Tôi cần hỗ trợ'),
    );
  });

  it('should use provided sessionId', async () => {
    const result = await service.sendMessage({
      message: 'Hello',
      sessionId: 'session-123',
    });

    expect(result.sessionId).toBe('session-123');
  });

  it('should include system prompt in LLM call', async () => {
    await service.sendMessage({ message: 'test' });

    expect(llmService.generate).toHaveBeenCalledWith(
      expect.stringContaining('trợ lý chăm sóc khách hàng'),
    );
  });
});
