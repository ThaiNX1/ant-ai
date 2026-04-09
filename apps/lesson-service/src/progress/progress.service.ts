import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgress } from '../database/entities/lesson-progress.entity';
import { StepAttempt } from '../database/entities/step-attempt.entity';

export interface StepResultInput {
  stepType: string;
  attemptNumber: number;
  inputType: string | null;
  sttText: string | null;
  pronunciationScore: number | null;
  pronunciationDetail: Record<string, unknown> | null;
  selectedOption: string | null;
  isCorrect: boolean;
  completionReason: string;
  feedbackGiven: string | null;
  durationMs: number | null;
}

export interface ResumeInfo {
  progress: LessonProgress;
  strategy: 'direct' | 'review' | 'restart';
  hoursElapsed: number;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
    @InjectRepository(StepAttempt)
    private readonly attemptRepo: Repository<StepAttempt>,
  ) {}

  async getOrCreateProgress(
    studentId: string,
    lessonId: string,
    enrollmentId: string,
    totalSteps: number,
  ): Promise<LessonProgress> {
    let progress = await this.progressRepo.findOne({
      where: { studentId, lessonId },
      order: { createdAt: 'DESC' },
    });

    if (!progress) {
      progress = this.progressRepo.create({
        studentId,
        lessonId,
        enrollmentId,
        totalSteps,
        status: 'in_progress',
        startedAt: new Date(),
      });
      progress = await this.progressRepo.save(progress);
      this.logger.log(`Created new progress for student ${studentId}, lesson ${lessonId}`);
    }

    return progress;
  }

  async saveStepResult(
    progressId: string,
    stepIndex: number,
    result: StepResultInput,
  ): Promise<StepAttempt> {
    const attempt = this.attemptRepo.create({
      lessonProgressId: progressId,
      stepIndex,
      stepType: result.stepType,
      attemptNumber: result.attemptNumber || 1,
      inputType: result.inputType,
      sttText: result.sttText,
      pronunciationScore: result.pronunciationScore,
      pronunciationDetail: result.pronunciationDetail,
      selectedOption: result.selectedOption,
      isCorrect: result.isCorrect,
      completionReason: result.completionReason,
      feedbackGiven: result.feedbackGiven,
      durationMs: result.durationMs,
    });

    const saved = await this.attemptRepo.save(attempt);

    // Update progress counters
    const progress = await this.progressRepo.findOneBy({ id: progressId });
    if (progress) {
      progress.currentStep = stepIndex + 1;
      if (result.isCorrect) {
        progress.passedSteps += 1;
      } else if (result.completionReason === 'timeout') {
        progress.skippedSteps += 1;
      } else {
        progress.failedSteps += 1;
      }
      await this.progressRepo.save(progress);
    }

    return saved;
  }

  async pauseLesson(progressId: string, reason: string): Promise<void> {
    await this.progressRepo.update(progressId, {
      status: 'paused',
      pausedAt: new Date(),
      pausedReason: reason,
    });
    this.logger.log(`Paused progress ${progressId}: ${reason}`);
  }

  async completeLesson(
    progressId: string,
    finalScore: number,
  ): Promise<void> {
    await this.progressRepo.update(progressId, {
      status: 'completed',
      score: finalScore,
      completedAt: new Date(),
    });
    this.logger.log(`Completed progress ${progressId} with score ${finalScore}`);
  }

  async getResumeInfo(studentId: string): Promise<ResumeInfo | null> {
    const progress = await this.progressRepo.findOne({
      where: [
        { studentId, status: 'in_progress' },
        { studentId, status: 'paused' },
      ],
      order: { updatedAt: 'DESC' },
      relations: ['lesson'],
    });

    if (!progress) return null;

    const pausedAt = progress.pausedAt ?? progress.updatedAt;
    const hoursElapsed =
      (Date.now() - new Date(pausedAt).getTime()) / (1000 * 60 * 60);

    let strategy: 'direct' | 'review' | 'restart';
    if (hoursElapsed < 24) {
      strategy = 'direct'; // Resume directly from current step
    } else if (hoursElapsed < 24 * 7) {
      strategy = 'review'; // Quick review then continue
    } else {
      strategy = 'restart'; // Restart lesson (fast-forward mode)
    }

    return { progress, strategy, hoursElapsed };
  }
}
