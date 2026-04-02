import { Inject, Injectable } from '@nestjs/common';
import { REALTIME_ADAPTER } from '../constants/injection-tokens';
import { IRealtimeAdapter } from '../interfaces/realtime.interface';
import {
  RealtimeSessionConfig,
  RealtimeResponse,
} from '../interfaces/realtime-types.interface';

@Injectable()
export class RealtimeVoiceService {
  constructor(
    @Inject(REALTIME_ADAPTER)
    private readonly realtimeAdapter: IRealtimeAdapter,
  ) {}

  async connect(sessionConfig: RealtimeSessionConfig): Promise<void> {
    return this.realtimeAdapter.connect(sessionConfig);
  }

  feedAudio(audioChunk: Buffer): void {
    this.realtimeAdapter.feedAudio(audioChunk);
  }

  getResponseStream(): AsyncIterable<RealtimeResponse> {
    return this.realtimeAdapter.getResponseStream();
  }

  async disconnect(): Promise<void> {
    return this.realtimeAdapter.disconnect();
  }
}
