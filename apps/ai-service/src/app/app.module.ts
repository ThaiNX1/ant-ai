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
          apiKey: 'AIzaSyC5hkp5q92rny_04cI9LEFBLo6A8dLRK9A',
        },
        {
          name: 'openai-gpt-5.2',
          provider: 'openai',
          model: 'gpt-5.2',
          apiKey: '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',
        },
      ],
      tts: [
        {
          name: 'google-tts',
          provider: 'google-tts',
          model: 'google-tts',
          apiKey: 'AIzaSyC5hkp5q92rny_04cI9LEFBLo6A8dLRK9A',
        },
        {
          name: 'minimax',
          provider: 'minimax',
          model: 'speech-02-hd',
          apiKey: 'sk-api-oNxE3S5Ax04B0XZGTtqdnFgE74u4TzEatcc2Imy2s_YN1rKH9ZpDYh6vV0f8ZDtX3leTwqCME4fDwe9o2QdCVxcdu_CNGuWlvgUeSQ44BucS8aDt4ekxGKU',
        }
      ],
      stt: [
        {
          name: 'openai-whisper',
          provider: 'openai',
          model: 'whisper-1',
          apiKey: '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',
        },
        {
          name: 'deepgram',
          provider: 'deepgram',
          model: 'nova-3',
          apiKey: 'e73ea6ad2e956c8bc9fc900077e914bc035e60ba',
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
