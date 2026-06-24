import { Inject, Injectable } from '@nestjs/common';
import { STT_ADAPTER } from '../constants/injection-tokens';
import { ISttAdapter } from '../interfaces/stt.interface';
import { SttOptions } from '../interfaces/stt-options.interface';
import { SttTranscriptionResult } from '../interfaces/stt-object.interface';

@Injectable()
export class SttService {
  constructor(
    @Inject(STT_ADAPTER) private readonly sttAdapter: ISttAdapter,
  ) {}

  async transcribeAudio(
    audio: Buffer,
    options?: SttOptions,
  ): Promise<SttTranscriptionResult> {
    return this.sttAdapter.transcribeAudio(audio, options);
  }
}
