import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationHistory } from '../database/entities/conversation-history.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationHistory)
    private readonly conversationRepo: Repository<ConversationHistory>,
  ) {}

  async saveMessage(
    studentId: string,
    robotId: string | null,
    sessionId: string,
    mode: string,
    role: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<ConversationHistory> {
    const message = this.conversationRepo.create({
      studentId,
      robotId,
      sessionId,
      mode,
      role,
      content,
      metadata: metadata ?? {},
    });
    return this.conversationRepo.save(message);
  }

  async getRecentContext(
    studentId: string,
    limit = 20,
  ): Promise<ConversationHistory[]> {
    return this.conversationRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
