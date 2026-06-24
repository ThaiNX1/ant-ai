export interface SttOptions {
  language?: string;
  format?: string;
  sampleRate?: number;
  channels?: number;
  encoding?: string;
  [key: string]: unknown;
}
