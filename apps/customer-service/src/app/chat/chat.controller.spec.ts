import { ChatController } from './chat.controller';
import { ChatService, ChatResponse } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockResponse: ChatResponse = {
    reply: 'Hello!',
    sessionId: 'default',
  };

  beforeEach(() => {
    service = {
      sendMessage: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as ChatService;

    controller = new ChatController(service);
  });

  it('should send a message and return response', async () => {
    const result = await controller.sendMessage({ message: 'Hi' });
    expect(result).toEqual(mockResponse);
    expect(service.sendMessage).toHaveBeenCalledWith({ message: 'Hi' });
  });
});
