# Voice Streaming — Task List

> Python voice-streaming = CHỈ UDP/RTP audio bridge
> NestJS lesson-service = TẤT CẢ logic (Orchestrator, LLM, MQTT, DB, Cache)

## Phase 1: Database & Foundation (Tuần 1-2)

- [ ] 1. Database Schema (trong lesson-service)
  - [ ] 1.1 Tạo `apps/lesson-service/src/database/` — TypeORM config + migrations
  - [ ] 1.2 Tạo entities: Course, Lesson, LessonStep
  - [ ] 1.3 Tạo entities: Student, Robot, StudentRobot
  - [ ] 1.4 Tạo entities: Enrollment, LessonProgress
  - [ ] 1.5 Tạo entities: StepAttempt, ConversationHistory
  - [ ] 1.6 Tạo entities: LearningSession, StudentWordStats
  - [ ] 1.7 Tạo entity: FeedbackCache
  - [ ] 1.8 Tạo repositories cho tất cả entities
  - [ ] 1.9 Seed data: sample course + lessons + steps (Animals lesson)
  - [ ] 1.10 Unit tests cho repositories

- [ ] 2. Scaffold lesson-service app (NestJS)
  - [ ] 2.1 `nx g @nx/nest:app lesson-service`
  - [ ] 2.2 Import AiCoreModule, DatabaseModule, ConfigModule
  - [ ] 2.3 Setup .env (DB, Redis, MQTT, Azure Speech)
  - [ ] 2.4 Setup Dockerfile
  - [ ] 2.5 Setup project.json (Nx targets)


## Phase 2: Core Services — NestJS lesson-service (Tuần 3-5)

- [ ] 3. Lesson Module
  - [ ] 3.1 Tạo `lesson/lesson.module.ts`
  - [ ] 3.2 Tạo `lesson/lesson-loader.service.ts` — load lesson + steps + progress từ DB
  - [ ] 3.3 Tạo `lesson/prompt-builder.service.ts` — build prompt cho từng step type
  - [ ] 3.4 Tạo `lesson/models/` — StepResult, StepContext, LessonSession interfaces
  - [ ] 3.5 Tạo `lesson/step-completion.engine.ts` — logic chuyển step (thuần, không gọi LLM)
  - [ ] 3.6 Tạo `lesson/lesson-orchestrator.service.ts` — main loop, process steps
  - [ ] 3.7 Unit tests

- [ ] 4. Progress Module
  - [ ] 4.1 Tạo `progress/progress.module.ts`
  - [ ] 4.2 Tạo `progress/progress.service.ts` — get_or_create, save_step_result, pause, complete
  - [ ] 4.3 Implement resume strategy (< 24h, 1-7 ngày, > 7 ngày)
  - [ ] 4.4 Tạo `progress/conversation.service.ts` — save message, get recent context
  - [ ] 4.5 Tạo `progress/word-stats.service.ts` — update stats, get weak words, mastery level
  - [ ] 4.6 Unit tests

- [ ] 5. Cache Module
  - [ ] 5.1 Tạo `cache/cache.module.ts` — Redis connection (ioredis hoặc @nestjs/cache-manager)
  - [ ] 5.2 Tạo `cache/lesson-cache-warmer.service.ts` — pre-generate feedback khi load bài
  - [ ] 5.3 Tạo `cache/cached-feedback.service.ts` — 3 tầng: Redis → DB → LLM + write-back
  - [ ] 5.4 Implement `_persist()` — write-back vào cả Redis + DB (feedback_cache)
  - [ ] 5.5 Implement `_trackHit()` — async update hit_count
  - [ ] 5.6 Unit tests (mock Redis + DB + LLM)

- [ ] 6. Session Module
  - [ ] 6.1 Tạo `session/session.module.ts`
  - [ ] 6.2 Tạo `session/session-manager.service.ts` — on_connect, switch_mode, on_disconnect
  - [ ] 6.3 Implement cleanup idle sessions (> 5 phút)
  - [ ] 6.4 Tạo `session/session-router.service.ts` — route robot → voice-streaming instance
  - [ ] 6.5 Unit tests

- [ ] 7. Free Talk Module
  - [ ] 7.1 Tạo `free-talk/free-talk.module.ts`
  - [ ] 7.2 Tạo `free-talk/free-talk.service.ts` — STT → LLM (với history) → TTS
  - [ ] 7.3 Unit tests

## Phase 3: MQTT Integration — NestJS (Tuần 5-6)

- [ ] 8. MQTT Module
  - [ ] 8.1 Tạo `mqtt/mqtt.module.ts` — MQTT client (nest-mqtt hoặc mqtt.js)
  - [ ] 8.2 Tạo `mqtt/mqtt.service.ts` — publish/subscribe
  - [ ] 8.3 Implement `publishImage()` — gửi ảnh xuống robot
  - [ ] 8.4 Implement `publishQuizOptions()` — gửi quiz options
  - [ ] 8.5 Implement `publishCommand()` — gửi lệnh (next_step, pause, end)
  - [ ] 8.6 Implement `subscribeStudentEvents()` — nhận answer, event, status
  - [ ] 8.7 Config MQTT broker URL từ .env
  - [ ] 8.8 Unit tests

## Phase 4: Audio Bridge — WebSocket Gateway (Tuần 6-7)

- [ ] 9. Audio Gateway (NestJS lesson-service)
  - [ ] 9.1 Tạo `audio/audio.module.ts`
  - [ ] 9.2 Tạo `audio/audio.gateway.ts` — WebSocket gateway nhận audio từ Python
  - [ ] 9.3 Handle message types: audio, silence_detected, audio_level, robot_connected/disconnected
  - [ ] 9.4 Forward audio → STT / Pronunciation service
  - [ ] 9.5 Send TTS audio back → Python qua WebSocket
  - [ ] 9.6 Unit tests

- [ ] 10. Python Audio Bridge (refactor voice-streaming)
  - [ ] 10.1 Tạo `apps/voice-streaming/audio_bridge.py` — nhận UDP, forward WS
  - [ ] 10.2 Tạo `apps/voice-streaming/opus_handler.py` — encode/decode Opus
  - [ ] 10.3 Tạo `apps/voice-streaming/silence_detector.py` — detect silence, audio level
  - [ ] 10.4 Implement WebSocket client → connect tới NestJS lesson-service
  - [ ] 10.5 Implement nhận TTS audio từ NestJS → encode Opus → gửi UDP về robot
  - [ ] 10.6 Cập nhật main.py — chỉ chạy audio bridge
  - [ ] 10.7 Xóa code cũ: ai_client/, services/ (chuyển sang NestJS)
  - [ ] 10.8 Cập nhật requirements.txt (bỏ aiohttp, thêm websockets)
  - [ ] 10.9 Unit tests

## Phase 5: Pronunciation — NestJS (Tuần 7-8)

- [ ] 11. Pronunciation Adapter (libs/ai-core)
  - [ ] 11.1 Tạo `libs/ai-core/src/interfaces/pronunciation.interface.ts` — IPronunciationAdapter
  - [ ] 11.2 Tạo `libs/ai-core/src/adapters/azure-pronunciation.adapter.ts` — Azure Speech SDK
  - [ ] 11.3 Cập nhật AdapterFactory — thêm pronunciation
  - [ ] 11.4 Cập nhật AiCoreModule — thêm pronunciation config
  - [ ] 11.5 Unit tests

- [ ] 12. Pronunciation Module (lesson-service)
  - [ ] 12.1 Tạo `pronunciation/pronunciation.module.ts`
  - [ ] 12.2 Tạo `pronunciation/pronunciation.service.ts` — assess, constrained STT
  - [ ] 12.3 Implement constrained STT (phrase list / prompt hint)
  - [ ] 12.4 Implement audio level detection
  - [ ] 12.5 Unit tests


## Phase 6: Multi-Channel Orchestrator (Tuần 8-9)

- [ ] 13. Multi-Channel Orchestrator (NestJS)
  - [ ] 13.1 Tạo `lesson/multi-channel-orchestrator.service.ts`
  - [ ] 13.2 Implement `executeTeachStep()` — MQTT ảnh → chờ load → LLM → TTS → WS audio
  - [ ] 13.3 Implement `executePronounceStep()` — MQTT ảnh → TTS prompt → chờ audio → assess
  - [ ] 13.4 Implement `executeQuizStep()` — MQTT options → TTS câu hỏi → chờ answer (race)
  - [ ] 13.5 Implement `executeVoiceQuizStep()` — MQTT ảnh → TTS → STT + Pronunciation song song
  - [ ] 13.6 Implement `waitForAnswer()` — race giữa MQTT touch và WS voice
  - [ ] 13.7 Integration tests

## Phase 7: Session Routing & Scale (Tuần 10)

- [ ] 14. Session Router
  - [ ] 14.1 Tạo `session/session-router.controller.ts` — GET /connect?robot_id=xxx
  - [ ] 14.2 Implement routing: check existing → assign instance ít session nhất
  - [ ] 14.3 Tạo entities: VoiceInstance, ActiveSession
  - [ ] 14.4 Implement heartbeat: voice-streaming instances báo cáo active_count
  - [ ] 14.5 Unit tests

## Phase 8: Integration & Testing (Tuần 11-12)

- [ ] 15. Integration Tests
  - [ ] 15.1 Test full flow: robot connect → Python audio bridge → NestJS orchestrator → lesson complete
  - [ ] 15.2 Test resume flow: disconnect → reconnect → tiếp tục đúng step
  - [ ] 15.3 Test free talk flow: audio → STT → LLM → TTS → audio back
  - [ ] 15.4 Test cache flow: pre-warm → Redis hit → DB hit → LLM fallback → write-back
  - [ ] 15.5 Test multi-channel: MQTT image + WS audio đồng bộ
  - [ ] 15.6 Test timeout/nudge: im lặng → nudge → timeout → advance
  - [ ] 15.7 Test pronunciation pipeline: constrained STT + Azure assessment + cached feedback
  - [ ] 15.8 Load test: 100 concurrent sessions (Python + NestJS)

- [ ] 16. Docker & Deployment
  - [ ] 16.1 Cập nhật `apps/voice-streaming/Dockerfile` — lightweight, chỉ audio bridge
  - [ ] 16.2 Tạo `apps/lesson-service/Dockerfile`
  - [ ] 16.3 Cập nhật `apps/voice-streaming/requirements.txt` — bỏ aiohttp, thêm websockets, opus
  - [ ] 16.4 Docker compose cho local dev (PostgreSQL + Redis + MQTT broker + all services)
  - [ ] 16.5 Tạo deployment scripts (EC2 cho Python, Fargate cho NestJS)

## Phase 9: Monitoring & Analytics (Tuần 13+)

- [ ] 17. Monitoring
  - [ ] 17.1 Session metrics: active sessions, latency per step type
  - [ ] 17.2 Cache metrics: hit rate (Redis/DB/LLM), miss rate
  - [ ] 17.3 LLM metrics: calls/s, latency, cost tracking
  - [ ] 17.4 Pronunciation metrics: average scores per word, per age group
  - [ ] 17.5 Audio bridge metrics: UDP packet loss, WebSocket latency
  - [ ] 17.6 CloudWatch integration

- [ ] 18. Analytics Dashboard Data
  - [ ] 18.1 Query: top 10 từ vựng trẻ hay sai nhất
  - [ ] 18.2 Query: average lesson completion rate
  - [ ] 18.3 Query: average pronunciation score per lesson
  - [ ] 18.4 Query: most used feedback (hit_count từ feedback_cache)
  - [ ] 18.5 Query: session duration distribution
