import { SttOptions } from './stt-options.interface';
import { SttTranscriptionResult } from './stt-object.interface';

export interface ISttAdapter {
  transcribeAudio(
    audio: Buffer,
    options?: SttOptions,
  ): Promise<SttTranscriptionResult>;
}
