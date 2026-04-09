export interface StepResult {
  action: 'advance' | 'retry' | 'wait' | 'nudge';
  reason: string;
  passed: boolean;
  score: number | null;
  correctAnswer: string | null;
  remainingAttempts: number;
}

export function createStepResult(
  partial: Partial<StepResult> & Pick<StepResult, 'action'>,
): StepResult {
  return {
    action: partial.action,
    reason: partial.reason ?? '',
    passed: partial.passed ?? false,
    score: partial.score ?? null,
    correctAnswer: partial.correctAnswer ?? null,
    remainingAttempts: partial.remainingAttempts ?? 0,
  };
}
