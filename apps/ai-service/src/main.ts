import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { config } from 'dotenv';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './app/filters/global-exception.filter';

import { WsAdapter } from '@nestjs/platform-ws';

// Load .env before anything reads process.env
config({ path: 'apps/ai-service/.env' });

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  
  app.useWebSocketAdapter(new WsAdapter(app));

  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api/v1');
  const port = process.env['PORT'] || 8081;
  await app.listen(port, '0.0.0.0');
  console.log(`AI service run on port http://localhost:${port}`);
}

bootstrap();
