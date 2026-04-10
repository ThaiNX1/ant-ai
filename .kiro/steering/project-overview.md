---
inclusion: always
---

# AI Platform Monorepo — Project Overview

## Tech Stack
- Monorepo: Nx 20.8 (polyglot — NestJS + Python)
- Framework: NestJS 10 + Fastify (KHÔNG dùng Express)
- Language: TypeScript 5.7 (NestJS), Python 3.10+ (voice-streaming)
- Database: TypeORM 0.3 + PostgreSQL 16
- Logging: nestjs-pino (structured JSON)
- Config: @nestjs/config + joi validation
- Testing: Jest 29 + fast-check 3.23 (property-based testing)
- AI Providers: Google Gemini, OpenAI (Whisper, Realtime), ElevenLabs

## Monorepo Structure
```
apps/
  ai-service/          — NestJS: expose AI qua HTTP/WebSocket (port 8081)
  customer-service/    — NestJS: CSKH (port 8082)
  lesson-service/      — NestJS: quản lý bài học (port 8083)
  voice-streaming/     — Python: voice streaming RTP/UDP

libs/
  ai-core/             — AI adapters + services (LLM, TTS, STT, Realtime)
  database/            — TypeORM + PostgreSQL repositories
  backend-client/      — HTTP client gọi backend API bên ngoài
  common/              — Config, auth, DTOs, utilities
```

## TypeScript Path Aliases
- `@ai-platform/common` → libs/common/src/index.ts
- `@ai-platform/ai-core` → libs/ai-core/src/index.ts
- `@ai-platform/database` → libs/database/src/index.ts
- `@ai-platform/backend-client` → libs/backend-client/src/index.ts

## Nx Commands
- Build: `npx nx build <app-name>`
- Test: `npx nx test <app-name>`
- Lint: `npx nx lint <app-name>`
- Serve: `npx nx serve <app-name>`
- Affected: `npx nx affected -t test` (chỉ test apps bị ảnh hưởng)

## Deployment
- NestJS apps → ECS Fargate (private subnet)
- voice-streaming → EC2 (public subnet, Elastic IP, UDP)
- Database → PostgreSQL RDS
- Load Balancer → ALB (path-based routing)
