import { Injectable, Inject, Logger } from '@nestjs/common';
import { ILlmAdapter, LLM_ADAPTER } from '@ai-platform/ai-core';
import { ConversationService } from '../progress/conversation.service';
import { ConversationHistory } from '../database/entities/conversation-history.entity';

@Injectable()
export class FreeTalkService {
  private readonly logger = new Logger(FreeTalkService.name);

  private static readonly SYSTEM_PROMPT =
    'Bạn là trợ lý thông minh trên robot giáo dục.\n' +
    'Nói chuyện thân thiện, dễ hiểu, phù hợp trẻ em.\n' +
    'Trả lời ngắn gọn (dưới 3 câu) vì đây là hội thoại giọng nói.';

  constructor(
    @Inject(LLM_ADAPTER) private readonly llm: ILlmAdapter,
    private readonly conversationService: ConversationService,
  ) {}

  async handleVoiceInput(
    studentId: string,
    robotId: string,
    sessionId: string,
    sttText: string,
  ): Promise<string> {
    // Save student message
    await this.conversationService.saveMessage(
      studentId,
      robotId,
      sessionId,
      'free_talk',
      'student',
      sttText,
    );

    // Get recent conversation context
    const recentContext = await this.conversationService.getRecentContext(
      studentId,
      20,
    );

    // Build prompt with context
    const prompt = this.buildFreeTalkPrompt(
      FreeTalkService.SYSTEM_PROMPT,
      recentContext,
      sttText,
    );

    // Generate AI response
    const response = await this.llm.generate(prompt);

    // Save AI response
    await this.conversationService.saveMessage(
      studentId,
      robotId,
      sessionId,
      'free_talk',
      'ai',
      response,
    );

    this.logger.debug(`Free talk: "${sttText}" → "${response}"`);
    return response;
  }

  buildFreeTalkPrompt(
    systemPrompt: string,
    recentContext: ConversationHistory[],
    userMessage: string,
  ): string {
    // Build conversation history (oldest first)
    const history = [...recentContext]
      .reverse()
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    return (
      `${systemPrompt}\n\n` +
      (history ? `Lịch sử hội thoại gần đây:\n${history}\n\n` : '') +
      `Học sinh: ${userMessage}\n` +
      `Trợ lý:`
    );
  }
}
