import { Injectable } from '@nestjs/common';
import { LlmService } from '@ai-platform/ai-core';
import { ChatMessageDto } from './dto/chat-message.dto';

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly llmService: LlmService) {}

  async sendMessage(dto: ChatMessageDto): Promise<ChatResponse> {
    const systemPrompt =
      'Bạn là trợ lý chăm sóc khách hàng. Hãy trả lời lịch sự, chính xác và hữu ích.';
    const prompt = `${systemPrompt}\n\nKhách hàng: ${dto.message}`;

    const reply = await this.llmService.generate(prompt);

    return {
      reply,
      sessionId: dto.sessionId || 'default',
    };
  }
}
