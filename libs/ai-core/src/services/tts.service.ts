import { Inject, Injectable } from '@nestjs/common';
import { TTS_ADAPTER } from '../constants/injection-tokens';
import { ITtsAdapter } from '../interfaces/tts.interface';
import { TtsOptions } from '../interfaces/tts-options.interface';

@Injectable()
export class TtsService {
  constructor(
    @Inject(TTS_ADAPTER) private readonly ttsAdapter: ITtsAdapter,
  ) {}

  async synthesize(text: string, options?: TtsOptions): Promise<Buffer> {
    return this.ttsAdapter.synthesize(text, options);
  }

  streamSynthesize(text: string, options?: TtsOptions): AsyncIterable<Buffer> {
    return this.ttsAdapter.streamSynthesize(text, options);
  }
}
