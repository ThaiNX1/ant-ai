# Kế hoạch Triển khai: AI Platform Monorepo

## Tổng quan

Triển khai hệ thống AI Platform Monorepo polyglot (Nx) theo 5 phase: Foundation → Data Layer → AI Service → Python Refactor → Customer Service. TypeScript (NestJS + fast-check) cho các libs và NestJS apps, Python (Hypothesis) cho voice-streaming. Mỗi phase xây dựng trên phase trước, đảm bảo không có code orphan.

## Tasks

- [x] 1. Phase 1: Foundation — Nx workspace + libs/common + libs/ai-core
  - [x] 1.1 Khởi tạo Nx monorepo workspace polyglot
    - Chạy `npx create-nx-workspace ai-platform --preset=nest` để tạo workspace
    - Cấu hình `nx.json` hỗ trợ polyglot (NestJS + Python custom targets)
    - Tạo cấu trúc thư mục `apps/` và `libs/`
    - Cấu hình `tsconfig.base.json` với path aliases cho các libs (`@ai-platform/common`, `@ai-platform/ai-core`, v.v.)
    - Cài đặt dependencies chính: `@nestjs/core`, `@nestjs/platform-fastify`, `@nestjs/config`, `joi`, `fast-check`
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 Tạo libs/common — config loader, auth, DTOs, utils
    - Tạo thư viện: `nx g @nx/nest:library common --directory=libs/common`
    - Implement `config/env.config.ts` với joi schema validate biến môi trường (GEMINI_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE)
    - Implement `auth/auth.guard.ts` — SsrcAuthGuard kiểm tra SSRC whitelist
    - Implement DTOs: `StudentProfileDto`, `LessonDto`, `SessionDto` với class-validator decorators
    - Implement `utils/json-parser.util.ts` — parseJsonFromModelOutput()
    - Implement `utils/text.util.ts` — normalizeText(), extractAssistantMessage()
    - Export tất cả qua barrel file `index.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 1.3 Viết property test cho config validation (Property 1)
    - **Property 1: Config validation phát hiện đúng biến môi trường hợp lệ và không hợp lệ**
    - Sử dụng fast-check: generate arbitrary tập hợp biến môi trường, kiểm tra config loader trả về config hợp lệ khi đủ biến, throw lỗi khi thiếu biến
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 1.4 Viết property test cho AuthGuard SSRC whitelist (Property 2)
    - **Property 2: AuthGuard SSRC whitelist cho phép/từ chối đúng**
    - Sử dụng fast-check: generate arbitrary SSRC strings, kiểm tra AuthGuard cho phép SSRC trong whitelist và từ chối SSRC ngoài whitelist
    - **Validates: Requirements 2.3**

  - [ ]* 1.5 Viết property test cho DTO validation (Property 3)
    - **Property 3: DTO validation chấp nhận dữ liệu hợp lệ và từ chối dữ liệu không hợp lệ**
    - Sử dụng fast-check: generate arbitrary objects, kiểm tra validation pass khi thỏa constraints và fail khi vi phạm
    - **Validates: Requirements 2.4**

  - [ ]* 1.6 Viết property test cho JSON parser round-trip (Property 4)
    - **Property 4: JSON parser round-trip từ model output**
    - Sử dụng fast-check: generate arbitrary JSON objects, nhúng vào model output text, kiểm tra parseJsonFromModelOutput trích xuất đúng object gốc
    - **Validates: Requirements 2.5**

  - [ ]* 1.7 Viết property test cho text normalization idempotent (Property 5)
    - **Property 5: Text normalization là idempotent**
    - Sử dụng fast-check: generate arbitrary strings, kiểm tra `normalizeText(normalizeText(text)) === normalizeText(text)`
    - **Validates: Requirements 2.5**

  - [x] 1.8 Tạo libs/ai-core — interfaces, adapters, factory, module
    - Tạo thư viện: `nx g @nx/nest:library ai-core --directory=libs/ai-core`
    - Định nghĩa 4 abstract interfaces: `ILlmAdapter`, `ITtsAdapter`, `ISttAdapter`, `IRealtimeAdapter` trong `interfaces/`
    - Định nghĩa `AiCoreOptions`, `AdapterConfig` interfaces
    - Tạo injection tokens: `LLM_ADAPTER`, `TTS_ADAPTER`, `STT_ADAPTER`, `REALTIME_ADAPTER` trong `constants/injection-tokens.ts`
    - Implement `AdapterFactory` trong `adapters/adapter.factory.ts` với switch-case theo provider name
    - Implement `AiCoreModule` dynamic module với `register()` method tạo providers từ factory
    - Export tất cả qua barrel file `index.ts`
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [x] 1.9 Implement concrete adapters cho ai-core
    - Implement `GeminiLlmAdapter` — generate(), generateStream() sử dụng @google/generative-ai
    - Implement `ElevenLabsTtsAdapter` — synthesize(), streamSynthesize() sử dụng elevenlabs SDK
    - Implement `OpenAiSttAdapter` — transcribeAudio() sử dụng openai SDK
    - Implement `OpenAiRealtimeAdapter` — connect(), feedAudio(), getResponseStream(), disconnect() sử dụng ws WebSocket
    - Mỗi adapter throw exception chứa error code, message, provider name khi API lỗi
    - _Requirements: 3.2, 3.7_

  - [ ]* 1.10 Viết property test cho AdapterFactory (Property 6)
    - **Property 6: AdapterFactory tạo đúng adapter theo provider name**
    - Sử dụng fast-check: generate arbitrary provider names, kiểm tra factory trả về đúng adapter type cho valid names và throw error cho invalid names
    - **Validates: Requirements 3.4**

  - [ ]* 1.11 Viết property test cho AiCoreModule.register() (Property 7)
    - **Property 7: AiCoreModule.register() tạo DynamicModule với đầy đủ providers**
    - Sử dụng fast-check: generate arbitrary AiCoreOptions, kiểm tra register() trả về DynamicModule có providers và exports tương ứng
    - **Validates: Requirements 3.3**

  - [ ]* 1.12 Viết property test cho adapter error handling (Property 8)
    - **Property 8: Adapter error chứa đầy đủ thông tin lỗi**
    - Sử dụng fast-check: generate arbitrary error responses, kiểm tra exception chứa error code, message, provider name
    - **Validates: Requirements 3.7**

- [x] 2. Checkpoint Phase 1 — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.
  - Chạy `nx run-many --target=test --projects=common,ai-core` để verify

- [x] 3. Phase 2: Data Layer — libs/database + libs/backend-client + pipeline services
  - [x] 3.1 Tạo libs/database — TypeORM + PostgreSQL module
    - Tạo thư viện: `nx g @nx/nest:library database --directory=libs/database`
    - Implement TypeORM entities: `Student`, `Lesson`, `LearningSession`, `CompanionSession` với decorators, relations, jsonb columns
    - Implement `DatabaseModule` dynamic module với `register()` nhận PostgreSQL connection options
    - Cấu hình TypeORM.forRoot() với `synchronize: false` (dùng migrations)
    - Implement repositories: `StudentRepository`, `LessonRepository`, `LearningSessionRepository`, `CompanionSessionRepository` sử dụng TypeORM repository pattern
    - Implement `DatabaseService` với CRUD operations, load bundles, ensure entities
    - Export tất cả qua barrel file `index.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.2 Viết property test cho Database CRUD round-trip (Property 9)
    - **Property 9: Database CRUD round-trip**
    - Sử dụng fast-check: generate arbitrary entity data, create rồi read lại bằng ID, kiểm tra dữ liệu tương đương
    - Cần test database (PostgreSQL container hoặc in-memory)
    - **Validates: Requirements 4.3**

  - [ ]* 3.3 Viết property test cho Database connection error (Property 10)
    - **Property 10: Database connection error mô tả rõ nguyên nhân**
    - Sử dụng fast-check: generate arbitrary invalid connection configs, kiểm tra exception chứa thông tin mô tả nguyên nhân
    - **Validates: Requirements 4.4**

  - [x] 3.4 Tạo libs/backend-client — HTTP client module
    - Tạo thư viện: `nx g @nx/nest:library backend-client --directory=libs/backend-client`
    - Implement `BackendClientModule` dynamic module với `register()` nhận baseUrl và timeout
    - Implement `BackendClient` — getAccountAndDeviceInfo(), getLessonStatus() sử dụng axios/undici
    - Implement `BackendDeviceClient` — streamFileFromCache()
    - Xử lý HTTP errors (4xx/5xx) throw exception chứa status code và response body
    - Xử lý timeout exception
    - Export tất cả qua barrel file `index.ts`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.5 Viết property test cho Backend client HTTP error (Property 11)
    - **Property 11: Backend client HTTP error chứa status code và response body**
    - Sử dụng fast-check: generate arbitrary HTTP status codes (400-599) và response bodies, kiểm tra exception chứa đầy đủ thông tin
    - **Validates: Requirements 5.4**

  - [x] 3.6 Implement pipeline services trong libs/ai-core
    - Implement `VoiceToVoiceService` — pipeline: Realtime STT → TTS streaming
    - Implement `TextToVoiceService` — pipeline: LLM generate → TTS streaming
    - Các pipeline services inject adapters qua injection tokens
    - Thêm vào AiCoreModule providers và exports
    - _Requirements: 3.6_

- [x] 4. Checkpoint Phase 2 — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.
  - Chạy `nx run-many --target=test --projects=common,ai-core,database,backend-client` để verify

- [x] 5. Phase 3: AI Service App — apps/ai-service với controllers, WebSocket gateway, Docker
  - [x] 5.1 Scaffold apps/ai-service NestJS app
    - Tạo app: `nx g @nx/nest:app ai-service --directory=apps/ai-service`
    - Cấu hình `main.ts` sử dụng Fastify adapter thay Express
    - Cấu hình `app.module.ts` import `AiCoreModule.register()` với config từ biến môi trường
    - Import `CommonModule` cho config loader
    - Cấu hình `project.json` với targets: build, serve, test, lint, docker-build
    - _Requirements: 6.7, 6.8, 1.2_

  - [x] 5.2 Implement LLM controller
    - Tạo `llm/llm.controller.ts` với:
      - `POST /llm/generate` — nhận GenerateDto, trả về `{ result: string }`
      - `POST /llm/generate-stream` — nhận GenerateDto, trả về SSE (Server-Sent Events)
    - Tạo `GenerateDto` với validation decorators (@IsString, @IsNotEmpty)
    - Sử dụng `LlmService` từ ai-core
    - _Requirements: 6.1, 6.2_

  - [x] 5.3 Implement TTS controller
    - Tạo `tts/tts.controller.ts` với:
      - `POST /tts/synthesize-stream` — nhận SynthesizeDto, trả về chunked audio response qua FastifyReply
    - Tạo `SynthesizeDto` với validation decorators
    - Sử dụng `TtsService` từ ai-core
    - _Requirements: 6.3_

  - [x] 5.4 Implement STT controller
    - Tạo `stt/stt.controller.ts` với:
      - `POST /stt/transcribe` — nhận audio bytes, trả về `{ text: string }`
    - Sử dụng `SttService` từ ai-core
    - _Requirements: 6.4_

  - [x] 5.5 Implement Realtime WebSocket gateway
    - Tạo `realtime/realtime.gateway.ts` — WebSocket gateway tại path `/realtime`
    - Proxy kết nối tới OpenAI Realtime API
    - Quản lý session per client connection
    - Sử dụng `RealtimeVoiceService` từ ai-core
    - _Requirements: 6.5_

  - [x] 5.6 Implement health check và global exception filter
    - Tạo `health/health.controller.ts` — `GET /health` trả về trạng thái service
    - Implement `GlobalExceptionFilter` — map exceptions sang HTTP responses, structured logging, không expose internal stack traces
    - Cấu hình NestJS validation pipe global cho request validation (trả HTTP 400 khi thiếu trường bắt buộc)
    - _Requirements: 6.6, 6.9_

  - [ ]* 5.7 Viết property test cho AI Service endpoint contract (Property 12)
    - **Property 12: AI Service endpoint contract — valid input trả về valid response**
    - Sử dụng fast-check: generate arbitrary valid request bodies cho mỗi endpoint, kiểm tra response HTTP 200 với đúng format
    - Mock AI provider responses
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 5.8 Viết property test cho AI Service validation (Property 13)
    - **Property 13: AI Service validation — missing required fields trả về HTTP 400**
    - Sử dụng fast-check: generate arbitrary incomplete request bodies, kiểm tra response HTTP 400 với validation error message
    - **Validates: Requirements 6.9**

  - [x] 5.9 Cấu hình structured logging (nestjs-pino)
    - Cài đặt và cấu hình `nestjs-pino` cho structured JSON logging
    - Đảm bảo tất cả log output là valid JSON
    - _Requirements: 11.1_

  - [ ]* 5.10 Viết property test cho structured JSON logs (Property 15)
    - **Property 15: NestJS structured logs là valid JSON**
    - Sử dụng fast-check: generate arbitrary log events, kiểm tra output là chuỗi JSON hợp lệ có thể parse được
    - **Validates: Requirements 11.1**

  - [x] 5.11 Tạo Dockerfile cho ai-service
    - Viết multi-stage Dockerfile: build stage (nx build) + production stage (node)
    - Cấu hình environment variables
    - Đảm bảo Fargate-ready (health check, graceful shutdown)
    - _Requirements: 9.2_

- [x] 6. Checkpoint Phase 3 — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.
  - Chạy `nx run-many --target=test --all` để verify toàn bộ workspace

- [x] 7. Phase 4: Python Voice-Streaming Refactor — ai_client module, refactor services
  - [x] 7.1 Cấu hình Python voice-streaming trong Nx monorepo
    - Tạo `apps/voice-streaming/project.json` với custom targets: serve, test, docker-build, deploy
    - Cấu hình targets sử dụng lệnh shell (python, pytest, docker build)
    - Đảm bảo Nx dependency graph nhận diện voice-streaming
    - _Requirements: 7.7, 1.3_

  - [x] 7.2 Implement ai_client module — base client với retry và circuit breaker
    - Tạo `apps/voice-streaming/ai_client/__init__.py`
    - Implement `ai_service_client.py` — base HTTP client (aiohttp) với:
      - Configurable base_url và timeout
      - Retry với exponential backoff (1s, 2s, 4s, 8s, 16s)
      - Circuit breaker pattern (failure_threshold=5, recovery_timeout=30s, states: CLOSED/OPEN/HALF_OPEN)
    - _Requirements: 7.1, 7.6_

  - [x] 7.3 Implement ai_client — LlmClient, TtsClient, RealtimeClient
    - Implement `llm_client.py` — generate(), generate_stream() gọi POST /llm/generate và /llm/generate-stream
    - Implement `tts_client.py` — stream_synthesize() gọi POST /tts/synthesize-stream, xử lý chunked response
    - Implement `realtime_client.py` — WebSocket client proxy tới /realtime, connect(), feed_audio(), get_response_stream(), disconnect()
    - _Requirements: 7.2_

  - [ ]* 7.4 Viết property test cho retry + circuit breaker (Property 14)
    - **Property 14: Python ai_client retry với exponential backoff và circuit breaker**
    - Sử dụng Hypothesis: generate arbitrary chuỗi failure sequences, kiểm tra retry intervals tăng dần và circuit breaker mở sau failure_threshold
    - **Validates: Requirements 7.6**

  - [x] 7.5 Refactor voice-streaming services để sử dụng ai_client
    - Refactor services sử dụng `LlmClient` thay vì gọi trực tiếp Gemini API
    - Refactor services sử dụng `TtsClient` thay vì gọi trực tiếp ElevenLabs API
    - Refactor services sử dụng `RealtimeClient` thay vì gọi trực tiếp OpenAI Realtime API
    - Giữ nguyên 100% code trong `core/` (orchestrator, state, logic_processor) và `rtp_handler/` (UDP, Opus, bridges)
    - _Requirements: 7.3, 7.4_

  - [x] 7.6 Cập nhật Dockerfile và requirements.txt cho voice-streaming
    - Thêm `aiohttp` vào requirements.txt
    - Cập nhật Dockerfile nếu cần
    - Cấu hình biến môi trường AI_SERVICE_URL trỏ tới ai-service trong private subnet
    - _Requirements: 7.5_

- [x] 8. Checkpoint Phase 4 — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.
  - Chạy `nx run-many --target=test --all` để verify toàn bộ workspace bao gồm Python tests

- [x] 9. Phase 5: Customer Service App — apps/customer-service
  - [x] 9.1 Scaffold apps/customer-service NestJS app
    - Tạo app: `nx g @nx/nest:app customer-service --directory=apps/customer-service`
    - Cấu hình `main.ts` sử dụng Fastify adapter
    - Cấu hình `app.module.ts` import `AiCoreModule.register()` với config phù hợp use case CSKH
    - Import `DatabaseModule.register()` và `CommonModule`
    - Cấu hình `project.json` với targets: build, serve, test, lint, docker-build
    - _Requirements: 8.1, 1.2_

  - [x] 9.2 Implement business modules — ticket, chat, knowledge-base
    - Tạo `ticket/` module — quản lý ticket CSKH (CRUD operations)
    - Tạo `chat/` module — chat với khách hàng sử dụng LlmService từ AiCoreModule (in-process, không qua HTTP)
    - Tạo `knowledge-base/` module — RAG cho CSKH
    - _Requirements: 8.2, 8.3_

  - [x] 9.3 Implement health check cho customer-service
    - Tạo `health/health.controller.ts` — `GET /cs/health` trả về trạng thái service
    - Cấu hình structured logging (nestjs-pino)
    - _Requirements: 8.4, 11.1_

  - [x] 9.4 Tạo Dockerfile cho customer-service
    - Viết multi-stage Dockerfile tương tự ai-service
    - Cấu hình environment variables
    - Đảm bảo Fargate-ready
    - _Requirements: 9.3_

- [x] 10. Checkpoint Phase 5 — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.
  - Chạy `nx run-many --target=test --all` để verify toàn bộ workspace

- [ ] 11. Wiring & CI/CD — Kết nối toàn bộ hệ thống
  - [ ] 11.1 Cấu hình CI/CD pipeline (GitHub Actions)
    - Tạo `.github/workflows/ci.yml` với:
      - `nx affected:build` — chỉ build apps bị ảnh hưởng
      - `nx affected:test` — chỉ test apps bị ảnh hưởng
      - `nx affected:lint` — chỉ lint apps bị ảnh hưởng
    - Cấu hình deploy steps cho NestJS apps: docker build → ECR push → ECS rolling update
    - Cấu hình deploy steps cho voice-streaming: docker build → ECR push → EC2 docker pull + restart
    - Dừng pipeline và thông báo lỗi nếu build/test thất bại
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 11.2 Cấu hình monitoring và CloudWatch alarms
    - Cấu hình CloudWatch Log Groups cho mỗi service
    - Tạo CloudWatch Alarms: EC2 CPU > 80%, EC2 StatusCheckFailed (auto-recovery), ECS auto-scaling CPU > 70%, ai-service response time > 500ms
    - Cấu hình SNS topic cho notifications
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 9.6, 9.7_

- [ ] 12. Final Checkpoint — Đảm bảo toàn bộ hệ thống hoạt động
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.
  - Verify: Nx build thành công toàn bộ libs và apps
  - Verify: Tất cả libs export đúng public APIs qua barrel files
  - Verify: Tất cả property-based tests và unit tests pass

## Ghi chú

- Tasks đánh dấu `*` là optional, có thể bỏ qua để đẩy nhanh MVP
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Checkpoints đảm bảo validation tăng dần sau mỗi phase
- Property tests sử dụng fast-check (TypeScript) và Hypothesis (Python)
- Unit tests và property tests bổ sung cho nhau — unit tests bắt lỗi cụ thể, property tests xác minh tính đúng đắn tổng quát
- TypeORM + PostgreSQL (KHÔNG dùng Supabase) cho database layer
