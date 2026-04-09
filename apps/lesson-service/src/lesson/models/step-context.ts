export class StepContext {
  attemptCount = 0;
  answer: string | null = null;
  sttText: string | null = null;
  pronunciationScore: number | null = null;
  pronunciationDetail: Record<string, unknown> | null = null;
  ttsCompleted = false;
  silenceDuration = 0;
  nudgeCount = 0;
  inputType: 'voice' | 'touch' | null = null;

  reset(): void {
    this.attemptCount = 0;
    this.answer = null;
    this.sttText = null;
    this.pronunciationScore = null;
    this.pronunciationDetail = null;
    this.ttsCompleted = false;
    this.silenceDuration = 0;
    this.nudgeCount = 0;
    this.inputType = null;
  }

  clearInput(): void {
    this.answer = null;
    this.sttText = null;
    this.pronunciationScore = null;
    this.pronunciationDetail = null;
    this.inputType = null;
  }

  updateFromEvent(event: {
    type: string;
    sttText?: string;
    pronunciationScore?: number;
    pronunciationDetail?: Record<string, unknown>;
    answer?: string;
    inputType?: 'voice' | 'touch';
  }): void {
    if (event.type === 'voice') {
      this.sttText = event.sttText ?? null;
      this.pronunciationScore = event.pronunciationScore ?? null;
      this.pronunciationDetail = event.pronunciationDetail ?? null;
      this.inputType = 'voice';
      this.attemptCount += 1;
      this.silenceDuration = 0;
    } else if (event.type === 'touch') {
      this.answer = event.answer ?? null;
      this.inputType = 'touch';
      this.attemptCount += 1;
      this.silenceDuration = 0;
    } else if (event.type === 'tts_done') {
      this.ttsCompleted = true;
    } else if (event.type === 'silence') {
      this.silenceDuration += 15;
    }
  }
}
