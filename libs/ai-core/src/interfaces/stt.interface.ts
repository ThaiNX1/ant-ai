import { SttOptions } from './stt-options.interface';

export interface ISttAdapter {
  transcribeAudio(audio: Buffer, options?: SttOptions): Promise<string>;
}
