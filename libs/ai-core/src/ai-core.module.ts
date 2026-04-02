import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AiCoreOptions } from './interfaces/ai-core-options.interface';
import {
  LLM_ADAPTER,
  TTS_ADAPTER,
  STT_ADAPTER,
  REALTIME_ADAPTER,
} from './constants/injection-tokens';
import { AdapterFactory } from './adapters/adapter.factory';
import { LlmService } from './services/llm.service';
import { TtsService } from './services/tts.service';
import { SttService } from './services/stt.service';
import { RealtimeVoiceService } from './services/realtime-voice.service';
import { VoiceToVoiceService } from './services/voice-to-voice.service';
import { TextToVoiceService } from './services/text-to-voice.service';

@Module({})
export class AiCoreModule {
  static register(options: AiCoreOptions): DynamicModule {
    const providers: Provider[] = [];
    const exports: (symbol | Function)[] = [];

    if (options.llm) {
      providers.push({
        provide: LLM_ADAPTER,
        useFactory: () => AdapterFactory.createLlm(options.llm!),
      });
      providers.push(LlmService);
      exports.push(LLM_ADAPTER, LlmService);
    }

    if (options.tts) {
      providers.push({
        provide: TTS_ADAPTER,
        useFactory: () => AdapterFactory.createTts(options.tts!),
      });
      providers.push(TtsService);
      exports.push(TTS_ADAPTER, TtsService);
    }

    if (options.stt) {
      providers.push({
        provide: STT_ADAPTER,
        useFactory: () => AdapterFactory.createStt(options.stt!),
      });
      providers.push(SttService);
      exports.push(STT_ADAPTER, SttService);
    }

    if (options.realtime) {
      providers.push({
        provide: REALTIME_ADAPTER,
        useFactory: () => AdapterFactory.createRealtime(options.realtime!),
      });
      providers.push(RealtimeVoiceService);
      exports.push(REALTIME_ADAPTER, RealtimeVoiceService);
    }

    // Pipeline: TextToVoiceService requires both LLM and TTS adapters
    if (options.llm && options.tts) {
      providers.push(TextToVoiceService);
      exports.push(TextToVoiceService);
    }

    // Pipeline: VoiceToVoiceService requires both Realtime and TTS adapters
    if (options.realtime && options.tts) {
      providers.push(VoiceToVoiceService);
      exports.push(VoiceToVoiceService);
    }

    return {
      module: AiCoreModule,
      providers,
      exports,
    };
  }
}
