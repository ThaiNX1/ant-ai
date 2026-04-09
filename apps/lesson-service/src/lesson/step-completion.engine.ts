import { Injectable } from '@nestjs/common';
import { LessonStep } from '../database/entities/lesson-step.entity';
import { StepContext } from './models/step-context';
import { StepResult, createStepResult } from './models/step-result.interface';

@Injectable()
export class StepCompletionEngine {
  checkCompletion(step: LessonStep, context: StepContext): StepResult {
    const stepType = step.type;

    switch (stepType) {
      case 'teach_with_image':
        return this.checkTeach(context);
      case 'pronounce':
        return this.checkPronounce(step, context);
      case 'image_quiz':
        return this.checkImageQuiz(step, context);
      case 'voice_quiz':
        return this.checkVoiceQuiz(step, context);
      case 'summary':
        return this.checkSummary(context);
      default:
        return createStepResult({ action: 'advance', reason: 'unknown_type' });
    }
  }

  private checkTeach(context: StepContext): StepResult {
    if (context.ttsCompleted) {
      return createStepResult({
        action: 'advance',
        reason: 'teach_done',
        passed: true,
      });
    }
    return createStepResult({ action: 'wait' });
  }

  private checkPronounce(step: LessonStep, context: StepContext): StepResult {
    const minScore = (step.config['min_score'] as number) ?? 50;
    const maxAttempts = (step.config['max_attempts'] as number) ?? 3;

    if (context.pronunciationScore !== null) {
      if (context.pronunciationScore >= minScore) {
        return createStepResult({
          action: 'advance',
          reason: 'passed',
          passed: true,
          score: context.pronunciationScore,
        });
      }
      if (context.attemptCount >= maxAttempts) {
        return createStepResult({
          action: 'advance',
          reason: 'max_attempts',
          passed: false,
          score: context.pronunciationScore,
        });
      }
      return createStepResult({
        action: 'retry',
        reason: 'score_low',
        remainingAttempts: maxAttempts - context.attemptCount,
      });
    }

    if (context.silenceDuration > 15) {
      return createStepResult({
        action: 'advance',
        reason: 'timeout',
        passed: false,
      });
    }
    return createStepResult({ action: 'wait' });
  }

  private checkImageQuiz(step: LessonStep, context: StepContext): StepResult {
    const maxAttempts = (step.config['max_attempts'] as number) ?? 2;
    const correct = (step.config['correct'] as string) ?? '';

    if (context.answer !== null || context.sttText !== null) {
      const studentAnswer = context.answer ?? context.sttText ?? '';
      const isCorrect = this.matchAnswer(
        studentAnswer,
        correct,
        step.config['options'] as Array<{ id: string; label: string }>,
      );

      if (isCorrect) {
        return createStepResult({
          action: 'advance',
          reason: 'correct',
          passed: true,
        });
      }
      if (context.attemptCount >= maxAttempts) {
        return createStepResult({
          action: 'advance',
          reason: 'max_attempts',
          passed: false,
          correctAnswer: correct,
        });
      }
      return createStepResult({ action: 'retry', reason: 'wrong' });
    }

    if (context.silenceDuration > 30) {
      return createStepResult({
        action: 'advance',
        reason: 'timeout',
        passed: false,
      });
    }
    if (context.silenceDuration > 15) {
      return createStepResult({ action: 'nudge', reason: 'remind' });
    }
    return createStepResult({ action: 'wait' });
  }

  private checkVoiceQuiz(step: LessonStep, context: StepContext): StepResult {
    const maxAttempts = (step.config['max_attempts'] as number) ?? 3;
    const minPron =
      (step.config['min_pronunciation_score'] as number) ?? 0;
    const correctAnswer = (step.config['correct_answer'] as string) ?? '';
    const acceptSimilar =
      (step.config['accept_similar'] as string[]) ?? [];

    if (context.sttText !== null) {
      const contentOk = this.fuzzyMatch(
        context.sttText,
        correctAnswer,
        acceptSimilar,
      );
      const pronOk =
        context.pronunciationScore === null ||
        context.pronunciationScore >= minPron;

      if (contentOk && pronOk) {
        return createStepResult({
          action: 'advance',
          reason: 'correct',
          passed: true,
          score: context.pronunciationScore,
        });
      }
      if (contentOk && !pronOk) {
        if (context.attemptCount >= maxAttempts) {
          return createStepResult({
            action: 'advance',
            reason: 'content_ok_pron_weak',
            passed: true,
            score: context.pronunciationScore,
          });
        }
        return createStepResult({
          action: 'retry',
          reason: 'pronunciation_weak',
          remainingAttempts: maxAttempts - context.attemptCount,
        });
      }
      if (context.attemptCount >= maxAttempts) {
        return createStepResult({
          action: 'advance',
          reason: 'max_attempts',
          passed: false,
          correctAnswer,
        });
      }
      return createStepResult({ action: 'retry', reason: 'wrong' });
    }

    if (context.silenceDuration > 30) {
      return createStepResult({
        action: 'advance',
        reason: 'timeout',
        passed: false,
      });
    }
    return createStepResult({ action: 'wait' });
  }

  private checkSummary(context: StepContext): StepResult {
    if (context.ttsCompleted) {
      return createStepResult({
        action: 'advance',
        reason: 'summary_done',
        passed: true,
      });
    }
    return createStepResult({ action: 'wait' });
  }

  private matchAnswer(
    studentAnswer: string,
    correct: string,
    options?: Array<{ id: string; label: string }>,
  ): boolean {
    const normalized = studentAnswer.trim().toLowerCase();
    if (normalized === correct.trim().toLowerCase()) return true;

    // Match by option label
    if (options) {
      const correctOption = options.find(
        (o) => o.id.toLowerCase() === correct.toLowerCase(),
      );
      if (
        correctOption &&
        normalized === correctOption.label.trim().toLowerCase()
      ) {
        return true;
      }
    }
    return false;
  }

  private fuzzyMatch(
    sttText: string,
    correctAnswer: string,
    acceptSimilar: string[],
  ): boolean {
    const normalized = sttText.trim().toLowerCase();
    if (normalized === correctAnswer.trim().toLowerCase()) return true;
    return acceptSimilar.some(
      (s) => normalized === s.trim().toLowerCase(),
    );
  }
}
