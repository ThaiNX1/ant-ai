export interface SttStreamOptions {
  encoding?: string;
  sampleRate?: number;
  model?: string;
  language?: string;
  interimResults?: boolean;
  punctuate?: boolean;
  endpointing?: number | false;
  [key: string]: unknown;
}

export interface TranscriptEvent {
  type: 'partial' | 'final' | 'speech_final' | 'error';
  transcript: string;
  confidence: number;
  timestamp: string;
  message?: string;
}

export type TranscriptCallback = (event: TranscriptEvent) => void;

export interface ISttStreamAdapter {
  connect(options?: SttStreamOptions): Promise<void>;
  sendAudio(chunk: Buffer): void;
  onTranscript(callback: TranscriptCallback): void;
  close(): Promise<void>;
}
