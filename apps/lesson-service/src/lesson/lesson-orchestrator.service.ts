import { Injectable, Logger } from '@nestjs/common';
import { LessonLoaderService } from './lesson-loader.service';
import { StepCompletionEngine } from './step-completion.engine';
import { PromptBuilderService } from './prompt-builder.service';
import { ProgressService } from '../progress/progress.service';
import { CachedFeedbackService } from '../cache/cached-feedback.service';
import { StepContext } from './models/step-context';
import { StepResult } from './models/step-result.interface';
import { LessonSession } from './models/lesson-session.interface';
import { LessonStep } from '../database/entities/lesson-step.entity';

@Injectable()
export class LessonOrchestratorService {
  private readonly logger = new Logger(LessonOrchestratorService.name);
  private session: LessonSession | null = null;
  private context = new StepContext();
  private currentStepIndex = 0;
  private paused = false;

  constructor(
    private readonly lessonLoader: LessonLoaderService,
    private readonly completionEngine: StepCompletionEngine,
    private readonly promptBuilder: PromptBuilderService,
    private readonly progressService: ProgressService,
    private readonly cachedFeedback: CachedFeedbackService,
  ) {}

  async run(studentId: string, lessonId: string): Promise<void> {
    this.session = await this.lessonLoader.loadLessonSession(
      studentId,
      lessonId,
    );
    this.currentStepIndex = this.session.progress.currentStep;
    this.context.reset();
    this.paused = false;

    this.logger.log(
      `Starting lesson ${lessonId} for student ${studentId} at step ${this.currentStepIndex}`,
    );

    while (this.currentStepIndex < this.session.steps.length) {
      if (this.paused) break;
      const step = this.session.steps[this.currentStepIndex];
      await this.startStep(step);
      await this.processUntilComplete(step);
    }

    if (
      this.currentStepIndex >= this.session.steps.length &&
      !this.paused
    ) {
      await this.completeLesson();
    }
  }

  async startStep(step: LessonStep): Promise<void> {
    this.context.reset();
    this.logger.log(
      `Starting step ${step.stepIndex} (${step.type})`,
    );
    // In a full implementation, this would:
    // - Publish image via MQTT
    // - Generate and play TTS prompt
    // For now, mark teach/summary steps as TTS completed immediately
    if (step.type === 'teach_with_image' || step.type === 'summary') {
      this.context.ttsCompleted = true;
    }
  }

  async processUntilComplete(step: LessonStep): Promise<void> {
    const maxIterations = 100; // safety guard
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;
      const result = this.completionEngine.checkCompletion(
        step,
        this.context,
      );

      if (result.action === 'advance') {
        await this.giveFeedback(step, result);
        await this.saveStepResult(step, result);
        this.currentStepIndex++;
        this.context.reset();
        await this.saveProgress();
        break;
      } else if (result.action === 'retry') {
        await this.giveRetryFeedback(step, result);
        this.context.clearInput();
        await this.waitForInput(step);
      } else if (result.action === 'nudge') {
        this.context.nudgeCount++;
        // In full implementation: TTS "Bạn ơi, thử nói đi nào!"
        await this.waitForInput(step);
      } else {
        // wait
        await this.waitForInput(step);
      }
    }
  }

  async waitForInput(_step: LessonStep): Promise<void> {
    // In full implementation, this would listen for voice/touch events
    // with a timeout. For now, simulate timeout to advance.
    this.context.silenceDuration += 16;
  }

  async giveFeedback(step: LessonStep, result: StepResult): Promise<void> {
    if (!this.session) return;

    if (
      step.type === 'pronounce' &&
      result.score !== null
    ) {
      const feedback = await this.cachedFeedback.getPronunciationFeedback(
        (step.config['word'] as string) ?? '',
        result.score,
        this.context.pronunciationDetail,
      );
      this.logger.debug(`Pronunciation feedback: ${feedback}`);
    } else if (
      step.type === 'image_quiz' ||
      step.type === 'voice_quiz'
    ) {
      const correctAnswer =
        (step.config['correct'] as string) ??
        (step.config['correct_answer'] as string) ??
        '';
      const feedback = await this.cachedFeedback.getQuizFeedback(
        correctAnswer,
        result.passed,
      );
      this.logger.debug(`Quiz feedback: ${feedback}`);
    }
  }

  async giveRetryFeedback(
    _step: LessonStep,
    result: StepResult,
  ): Promise<void> {
    this.logger.debug(
      `Retry feedback: ${result.reason}, remaining: ${result.remainingAttempts}`,
    );
    // In full implementation: generate and play TTS retry feedback
  }

  async saveStepResult(step: LessonStep, result: StepResult): Promise<void> {
    if (!this.session) return;

    await this.progressService.saveStepResult(
      this.session.progress.id,
      step.stepIndex,
      {
        stepType: step.type,
        attemptNumber: this.context.attemptCount,
        inputType: this.context.inputType,
        sttText: this.context.sttText,
        pronunciationScore: this.context.pronunciationScore,
        pronunciationDetail: this.context.pronunciationDetail,
        selectedOption: this.context.answer,
        isCorrect: result.passed,
        completionReason: result.reason,
        feedbackGiven: null,
        durationMs: null,
      },
    );
  }

  async saveProgress(): Promise<void> {
    if (!this.session) return;

    this.session.progress.currentStep = this.currentStepIndex;
    this.session.progress.status =
      this.currentStepIndex >= this.session.steps.length
        ? 'completed'
        : 'in_progress';
  }

  async completeLesson(): Promise<void> {
    if (!this.session) return;

    const finalScore = this.calculateFinalScore();
    await this.progressService.completeLesson(
      this.session.progress.id,
      finalScore,
    );
    this.logger.log(`Lesson completed with score: ${finalScore}`);
  }

  calculateFinalScore(): number {
    if (!this.session) return 0;

    const progress = this.session.progress;
    const totalGraded =
      progress.passedSteps + progress.failedSteps + progress.skippedSteps;
    if (totalGraded === 0) return 100;

    return Math.round((progress.passedSteps / totalGraded) * 100);
  }
}
