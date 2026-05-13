import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AiCoreModule } from '@ai-platform/ai-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './llm/llm.module';
import { TtsModule } from './tts/tts.module';
import { SttModule } from './stt/stt.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/ai-service/.env'
      ],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['LOG_LEVEL'] || 'info',
        autoLogging: true,
        hooks: {
          logMethod(args: any, method: any, level: any) {
            const context = typeof args[0] === 'object' ? args[0].context : undefined;
            if (context === 'RoutesResolver' || context === 'RouterExplorer') {
              return; // Bỏ qua không in log này
            }
            return method.apply(this, args);
          },
        },
        serializers: {
          req(req: Record<string, unknown>) {
            return {
              id: req['id'],
              method: req['method'],
              url: req['url'],
            };
          },
          res(res: Record<string, unknown>) {
            return {
              statusCode: res['statusCode'],
            };
          },
        },
      } as object,
    }),
    AiCoreModule.register({
      llm: [
        {
          name: 'gemini-flash',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          apiKey: '',
        },
        {
          name: 'openai-gpt-5.2',
          provider: 'openai',
          model: 'gpt-5.2',
          apiKey: '',
        },
      ],
      tts: [
        {
          name: 'google-tts',
          provider: 'google-tts',
          model: 'google-tts',
          apiKey: '',
        },
        {
          name: 'minimax',
          provider: 'minimax',
          model: 'speech-02-hd',
          apiKey: '',
        }
      ],
      stt: [
        {
          name: 'openai-whisper',
          provider: 'openai',
          model: 'whisper-1',
          apiKey: '',
        },
        {
          name: 'deepgram',
          provider: 'deepgram',
          model: 'nova-3',
          apiKey: '',
        },
      ],
      // Realtime adapters are NOT registered here as singletons —
      // RealtimeGateway creates a fresh adapter per WebSocket client connection.
    }),
    LlmModule,
    TtsModule,
    SttModule,
    RealtimeModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
