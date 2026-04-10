---
inclusion: manual
---

# Hướng dẫn tạo Feature mới

## Tạo NestJS App mới

1. Generate app:
```bash
npx nx g @nx/nest:app apps/<app-name>
```

2. Cấu hình Fastify (KHÔNG dùng Express):
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  const port = process.env['PORT'] || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
```

3. Cấu hình AppModule:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envConfigSchema,  // từ @ai-platform/common
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
        level: process.env['LOG_LEVEL'] || 'info',
      } as object,
    }),
    // Import shared libs khi cần:
    // AiCoreModule.register({ ... }),
    // DatabaseModule.register({ ... }),
    HealthModule,
  ],
})
export class AppModule {}
```

4. Luôn có HealthModule:
```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: '<app-name>',
      timestamp: new Date().toISOString(),
    };
  }
}
```

5. Tạo Dockerfile:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nx build <app-name> --prod

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/<app-name> ./
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "main.js"]
```

6. Tạo .env.example với tất cả biến môi trường cần thiết.

## Tạo Feature Module trong App

```bash
# Tạo module
npx nx g @nx/nest:module <feature-name> --project=<app-name>
# Tạo controller
npx nx g @nx/nest:controller <feature-name> --project=<app-name>
# Tạo service
npx nx g @nx/nest:service <feature-name> --project=<app-name>
```

Cấu trúc kết quả:
```
src/app/<feature-name>/
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
  <feature-name>.controller.ts
  <feature-name>.controller.spec.ts
  <feature-name>.service.ts
  <feature-name>.service.spec.ts
  <feature-name>.module.ts
```

## Tạo Shared Library mới

```bash
npx nx g @nx/nest:lib libs/<lib-name>
```

- Export public API qua `src/index.ts`
- Thêm path alias vào `tsconfig.base.json`:
  ```json
  "@ai-platform/<lib-name>": ["libs/<lib-name>/src/index.ts"]
  ```
- Dùng Dynamic Module pattern nếu cần configuration

## Checklist trước khi merge
- [ ] Lint pass: `npx nx lint <project>`
- [ ] Tests pass: `npx nx test <project>`
- [ ] Build pass: `npx nx build <project>`
- [ ] Có .env.example
- [ ] Có health endpoint
- [ ] Có unit tests cho controller và service
- [ ] DTOs có class-validator decorators
- [ ] Structured logging (nestjs-pino)
