import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from '../database/entities/lesson.entity';
import { LessonStep } from '../database/entities/lesson-step.entity';
import { Student } from '../database/entities/student.entity';
import { LessonProgress } from '../database/entities/lesson-progress.entity';
import { StepAttempt } from '../database/entities/step-attempt.entity';
import { Enrollment } from '../database/entities/enrollment.entity';
import { LessonLoaderService } from './lesson-loader.service';
import { PromptBuilderService } from './prompt-builder.service';
import { StepCompletionEngine } from './step-completion.engine';
import { LessonOrchestratorService } from './lesson-orchestrator.service';
import { ProgressModule } from '../progress/progress.module';
import { AppCacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lesson,
      LessonStep,
      Student,
      LessonProgress,
      StepAttempt,
      Enrollment,
    ]),
    ProgressModule,
    AppCacheModule,
  ],
  providers: [
    LessonLoaderService,
    PromptBuilderService,
    StepCompletionEngine,
    LessonOrchestratorService,
  ],
  exports: [
    LessonLoaderService,
    PromptBuilderService,
    StepCompletionEngine,
    LessonOrchestratorService,
  ],
})
export class LessonModule {}
