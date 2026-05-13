import { Module } from '@nestjs/common';
import { RealtimeGateway, REALTIME_CONFIGS } from './realtime.gateway';
import { NamedAdapterConfig } from '@ai-platform/ai-core';

@Module({
  providers: [
    {
      provide: REALTIME_CONFIGS,
      useFactory: (): NamedAdapterConfig[] => [
        {
          name: 'openai-realtime',
          provider: 'openai',
          model: 'gpt-4o-realtime-preview',
          apiKey: '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',
        },
        {
          name: 'gemini-realtime',
          provider: 'gemini',
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          apiKey: 'AIzaSyC5hkp5q92rny_04cI9LEFBLo6A8dLRK9A',
        },
      ],
    },
    RealtimeGateway,
  ],
  exports: [RealtimeGateway],
})
export class RealtimeModule { }
