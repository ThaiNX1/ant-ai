import { RealtimeSessionConfig, RealtimeResponse } from './realtime-types.interface';

export interface IRealtimeAdapter {
  connect(sessionConfig: RealtimeSessionConfig): Promise<void>;
  feedAudio(audioChunk: Buffer): void;
  getResponseStream(): AsyncIterable<RealtimeResponse>;
  disconnect(): Promise<void>;
}
