---
inclusion: fileMatch
fileMatchPattern: "**/*.controller.ts,**/*.dto.ts,**/*.guard.ts,**/*.filter.ts"
---

# API Standards

## HTTP Server
- Fastify adapter (KHÔNG dùng Express)
- ValidationPipe global: whitelist, forbidNonWhitelisted, transform
- GlobalExceptionFilter cho error handling

## Endpoint Conventions
- RESTful routes: `GET /resources`, `POST /resources`, `GET /resources/:id`
- Route prefix = resource name (kebab-case)
- Streaming: SSE cho text streams, chunked response cho audio
- Health check: `GET /health` trả về `{ status, service, timestamp }`

## Request Validation (DTOs)

```typescript
import { IsString, IsNotEmpty, IsOptional, IsObject, IsInt, Min } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  quantity!: number;
}
```

## Response Format

Success:
```json
{
  "result": "data here"
}
```

List:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

Error:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

AI Provider Error (502):
```json
{
  "statusCode": 502,
  "message": "AI provider error: ...",
  "provider": "gemini",
  "code": "RATE_LIMIT"
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Validation error
- 401: Unauthorized
- 404: Not found
- 502: AI provider error
- 500: Internal server error

## Security
- ValidationPipe whitelist loại bỏ fields không khai báo trong DTO
- forbidNonWhitelisted throw error nếu có fields lạ
- Không expose internal error details trong production
- SsrcAuthGuard cho robot authentication
