---
inclusion: always
---

# Coding Conventions

## Ngôn ngữ & Format
- Viết code bằng TypeScript strict mode
- Prettier: single quotes, trailing commas
- Không dùng `any` — dùng `unknown` rồi narrow type
- Dùng `!` (definite assignment) cho class properties có decorator: `prompt!: string`
- Dùng bracket notation cho `process.env`: `process.env['PORT']` (không dùng dot notation)

## Naming Conventions
- Files: kebab-case — `create-ticket.dto.ts`, `llm.controller.ts`
- Classes: PascalCase — `LlmController`, `ChatService`
- Interfaces: PascalCase với prefix `I` cho adapter interfaces — `ILlmAdapter`, `ITtsAdapter`
- DTOs: PascalCase với suffix `Dto` — `GenerateDto`, `CreateTicketDto`
- Modules: PascalCase với suffix `Module` — `LlmModule`, `HealthModule`
- Services: PascalCase với suffix `Service` — `ChatService`, `LlmService`
- Controllers: PascalCase với suffix `Controller` — `LlmController`
- Guards: PascalCase với suffix `Guard` — `SsrcAuthGuard`
- Filters: PascalCase với suffix `Filter` — `GlobalExceptionFilter`
- Constants/Tokens: UPPER_SNAKE_CASE — `LLM_ADAPTER`, `TTS_ADAPTER`
- Enum values: PascalCase
- Test files: `<name>.spec.ts` (cùng thư mục với file gốc)

## NestJS Patterns

### Module Structure
Mỗi feature module trong app có cấu trúc:
```
feature-name/
  dto/
    create-feature.dto.ts
    update-feature.dto.ts
  feature-name.controller.ts
  feature-name.controller.spec.ts
  feature-name.service.ts
  feature-name.service.spec.ts
  feature-name.module.ts
```

### Dynamic Modules (libs)
- Dùng `static register(options): DynamicModule` cho configuration
- Export public API qua barrel file `index.ts`
- Dùng injection tokens cho abstract adapters

### Controllers
- Mỗi controller chỉ handle HTTP concerns (parse request, return response)
- Business logic nằm trong Service
- Dùng DTOs với class-validator decorators cho request validation
- Route prefix = tên resource (kebab-case): `@Controller('llm')`, `@Controller('health')`

### Services
- Inject dependencies qua constructor
- Không truy cập `request` object trực tiếp — nhận data qua parameters
- Throw NestJS exceptions (`HttpException`, `NotFoundException`, etc.) cho business errors

### DTOs
- Dùng class-validator decorators: `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`
- Dùng `class-transformer` khi cần transform data
- Mỗi DTO là một class (không dùng interface cho validation)

## Error Handling
- GlobalExceptionFilter xử lý tất cả exceptions
- AdapterError cho AI provider errors (status 502)
- HttpException cho business logic errors
- Không expose stack traces trong production
- Log errors với structured format (nestjs-pino)

## Logging
- Dùng nestjs-pino (structured JSON logs)
- Dev: pino-pretty với colorize
- Production: JSON format (cho CloudWatch)
- Log levels: error, warn, info, debug
- Không log sensitive data (API keys, passwords)

## Imports
- Thứ tự imports:
  1. NestJS/Node built-in modules
  2. Third-party packages
  3. `@ai-platform/*` shared libraries
  4. Relative imports (local files)
- Dùng `export type` cho type-only exports trong barrel files
