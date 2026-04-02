export interface TtsOptions {
  voiceId?: string;
  speed?: number;
  pitch?: number;
  format?: string;
  [key: string]: unknown;
}
