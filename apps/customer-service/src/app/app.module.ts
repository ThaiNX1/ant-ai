import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AiCoreModule } from '@ai-platform/ai-core';
import { DatabaseModule } from '@ai-platform/database';
import { envConfigSchema } from '@ai-platform/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { ChatModule } from './chat/chat.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
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
        name: 'gemini-flash',
        provider: process.env['LLM_PROVIDER'] || 'gemini',
        model: process.env['LLM_MODEL'] || 'gemini-2.5-flash',
        apiKey: process.env['GEMINI_API_KEY'] || '',
      },
    }),
    DatabaseModule.register({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432', 10),
      username: process.env['DB_USERNAME'] || 'postgres',
      password: process.env['DB_PASSWORD'] || '',
      database: process.env['DB_DATABASE'] || 'customer_service',
    }),
    TicketModule,
    ChatModule,
    KnowledgeBaseModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
