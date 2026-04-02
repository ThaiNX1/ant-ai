export interface RealtimeSessionConfig {
  model?: string;
  voice?: string;
  instructions?: string;
  [key: string]: unknown;
}

export interface RealtimeResponse {
  type: string;
  data: unknown;
}
