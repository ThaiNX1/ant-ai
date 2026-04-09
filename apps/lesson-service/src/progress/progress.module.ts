import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonProgress } from '../database/entities/lesson-progress.entity';
import { StepAttempt } from '../database/entities/step-attempt.entity';
import { ConversationHistory } from '../database/entities/conversation-history.entity';
import { StudentWordStats } from '../database/entities/student-word-stats.entity';
import { ProgressService } from './progress.service';
import { ConversationService } from './conversation.service';
import { WordStatsService } from './word-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonProgress,
      StepAttempt,
      ConversationHistory,
      StudentWordStats,
    ]),
  ],
  providers: [ProgressService, ConversationService, WordStatsService],
  exports: [ProgressService, ConversationService, WordStatsService],
})
export class ProgressModule {}
