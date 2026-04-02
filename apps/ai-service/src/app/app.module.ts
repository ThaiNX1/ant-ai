import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AiCoreModule } from '@ai-platform/ai-core';
import { envConfigSchema } from '@ai-platform/common';
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
      validationSchema: envConfigSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env['LOG_LEVEL'] || 'info',
        autoLogging: true,
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
      llm: {
        provider: process.env['LLM_PROVIDER'] || 'gemini',
        model: process.env['LLM_MODEL'] || 'gemini-2.0-flash',
        apiKey: process.env['GEMINI_API_KEY'] || '',
      },
      tts: {
        provider: process.env['TTS_PROVIDER'] || 'elevenlabs',
        model: process.env['TTS_MODEL'] || 'eleven_multilingual_v2',
        apiKey: process.env['ELEVENLABS_API_KEY'] || '',
      },
      stt: {
        provider: process.env['STT_PROVIDER'] || 'openai',
        model: process.env['STT_MODEL'] || 'whisper-1',
        apiKey: process.env['OPENAI_API_KEY'] || '',
      },
      realtime: {
        provider: process.env['REALTIME_PROVIDER'] || 'openai',
        model: process.env['REALTIME_MODEL'] || 'gpt-4o-realtime-preview',
        apiKey: process.env['OPENAI_API_KEY'] || '',
      },
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
export class AppModule {}
