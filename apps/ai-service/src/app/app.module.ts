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
import { AudioTranslateModule } from './audio-translate/audio-translate.module';

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
          model: process.env['GEMINI_LLM_MODEL'] || 'gemini-2.5-flash',
          apiKey: process.env['GEMINI_API_KEY'] || '',
        },
        {
          name: 'deepseek',
          provider: 'openai',
          model: process.env['DEEPSEEK_MODEL'] || 'deepseek-v4-flash',
          apiKey: process.env['DEEPSEEK_API_KEY'] || '',
          baseUrl: 'https://api.deepseek.com',
        },
        {
          name: 'qwen-flash',
          provider: 'qwen',
          model: process.env['QWEN_LLM_MODEL'] || 'qwen-mt-flash',
          apiKey: process.env['QWEN_API_KEY'] || '',
          baseUrl:
            process.env['QWEN_BASE_URL'] ||
            'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
        {
          name: 'openai-gpt',
          provider: 'openai',
          model: process.env['OPENAI_LLM_MODEL'] || 'gpt-5.2',
          apiKey: process.env['OPENAI_API_KEY'] || '',
        },
      ],
      tts: [
        {
          name: 'google-tts',
          provider: 'google-tts',
          model: 'google-tts',
          apiKey: process.env['GOOGLE_TTS_API_KEY'] || '',
        },
        {
          name: 'minimax',
          provider: 'minimax',
          model: process.env['MINIMAX_TTS_MODEL'] || 'speech-02-hd',
          apiKey: process.env['MINIMAX_API_KEY'] || '',
        },
        {
          name: 'openai-tts',
          provider: 'openai',
          model: process.env['OPENAI_TTS_MODEL'] || 'tts-1',
          apiKey: process.env['OPENAI_API_KEY'] || '',
        },
      ],
      stt: [
        {
          name: 'openai-whisper',
          provider: 'openai',
          model: process.env['OPENAI_STT_MODEL'] || 'whisper-1',
          apiKey: process.env['OPENAI_API_KEY'] || '',
        },
        {
          name: 'deepgram',
          provider: 'deepgram',
          model: process.env['DEEPGRAM_STT_MODEL'] || 'nova-3',
          apiKey: process.env['DEEPGRAM_API_KEY'] || '',
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
    AudioTranslateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
