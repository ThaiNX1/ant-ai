import { Inject, Injectable } from '@nestjs/common';
import { REALTIME_ADAPTER, TTS_ADAPTER } from '../constants/injection-tokens';
import { IRealtimeAdapter } from '../interfaces/realtime.interface';
import { ITtsAdapter } from '../interfaces/tts.interface';
import {
  RealtimeSessionConfig,
  RealtimeResponse,
} from '../interfaces/realtime-types.interface';
import { TtsOptions } from '../interfaces/tts-options.interface';

@Injectable()
export class VoiceToVoiceService {
  constructor(
    @Inject(REALTIME_ADAPTER)
    private readonly realtimeAdapter: IRealtimeAdapter,
    @Inject(TTS_ADAPTER)
    private readonly ttsAdapter: ITtsAdapter,
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

  async *processVoicePipeline(
    audioChunk: Buffer,
    ttsOptions?: TtsOptions,
  ): AsyncIterable<Buffer> {
    this.realtimeAdapter.feedAudio(audioChunk);

    for await (const response of this.realtimeAdapter.getResponseStream()) {
      if (response.type === 'transcript' && typeof response.data === 'string') {
        yield* this.ttsAdapter.streamSynthesize(response.data, ttsOptions);
      }
    }
  }
}
