import { Module } from '@nestjs/common';
import { RealtimeGateway, REALTIME_CONFIG } from './realtime.gateway';

@Module({
  providers: [
    {
      provide: REALTIME_CONFIG,
      useFactory: () => ({
        name: 'openai-realtime',
        provider: process.env['REALTIME_PROVIDER'] || 'openai',
        model: process.env['REALTIME_MODEL'] || 'gpt-4o-realtime-preview',
        apiKey: process.env['OPENAI_API_KEY'] || '',
      }),
    },
    RealtimeGateway,
  ],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
