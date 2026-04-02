import { TtsOptions } from './tts-options.interface';

export interface ITtsAdapter {
  synthesize(text: string, options?: TtsOptions): Promise<Buffer>;
  streamSynthesize(text: string, options?: TtsOptions): AsyncIterable<Buffer>;
}
