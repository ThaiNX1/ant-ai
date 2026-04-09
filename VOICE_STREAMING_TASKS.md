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
  - [ ] 7.2 Tạo `free-talk/free-talk.service.ts` — STT → LLM (với history) → TTS (custom voice)
  - [ ] 7.3 Unit tests

- [ ] 8. VoiceConfig Module
  - [ ] 8.1 Tạo `voice/voice-config.interface.ts` — VoiceConfig (voiceId, stability, similarityBoost, style, speed, language)
  - [ ] 8.2 Tạo `voice/voice-config.service.ts` — load voice config từ DB (course > robot > system default)
  - [ ] 8.3 Tạo `voice/voice.module.ts`
  - [ ] 8.4 Tích hợp VoiceConfig vào TTS calls (truyền voiceId + params vào mọi TTS request)
  - [ ] 8.5 Unit tests

## Phase 3: MQTT Integration — NestJS (Tuần 5-6)

- [ ] 9. MQTT Module
  - [ ] 9.1 Tạo `mqtt/mqtt.module.ts` — MQTT client (nest-mqtt hoặc mqtt.js)
  - [ ] 9.2 Tạo `mqtt/mqtt.service.ts` — publish/subscribe
  - [ ] 9.3 Implement `publishImage()` — gửi ảnh xuống robot
  - [ ] 9.4 Implement `publishQuizOptions()` — gửi quiz options
  - [ ] 9.5 Implement `publishCommand()` — gửi lệnh (next_step, pause, end)
  - [ ] 9.6 Implement `subscribeStudentEvents()` — nhận answer, event, status
  - [ ] 9.7 Config MQTT broker URL từ .env
  - [ ] 9.8 Unit tests

## Phase 4: Audio Bridge (Tuần 6-7)

- [ ] 10. Audio Gateway (NestJS lesson-service)
  - [ ] 10.1 Tạo `audio/audio.module.ts`
  - [ ] 10.2 Tạo `audio/audio.gateway.ts` — WebSocket gateway nhận audio từ Python
  - [ ] 10.3 Handle message types: audio, silence_detected, audio_level, robot_connected/disconnected
  - [ ] 10.4 Forward audio → STT / Pronunciation service
  - [ ] 10.5 Send TTS audio (với VoiceConfig) back → Python qua WebSocket
  - [ ] 10.6 Unit tests

- [ ] 11. Python Audio Bridge (refactor voice-streaming)
  - [ ] 11.1 Tạo `apps/voice-streaming/audio_bridge.py` — nhận UDP, forward WS
  - [ ] 11.2 Tạo `apps/voice-streaming/opus_handler.py` — encode/decode Opus
  - [ ] 11.3 Tạo `apps/voice-streaming/silence_detector.py` — detect silence, audio level
  - [ ] 11.4 Implement WebSocket client → connect tới NestJS lesson-service
  - [ ] 11.5 Implement nhận TTS audio từ NestJS → encode Opus → gửi UDP về robot
  - [ ] 11.6 Cập nhật main.py — chỉ chạy audio bridge
  - [ ] 11.7 Xóa code cũ: ai_client/, services/ (chuyển sang NestJS)
  - [ ] 11.8 Cập nhật requirements.txt (bỏ aiohttp, thêm websockets)
  - [ ] 11.9 Unit tests

## Phase 5: Pronunciation — NestJS (Tuần 7-8)

- [ ] 12. Pronunciation Adapter (libs/ai-core)
  - [ ] 12.1 Tạo `libs/ai-core/src/interfaces/pronunciation.interface.ts` — IPronunciationAdapter
  - [ ] 12.2 Tạo `libs/ai-core/src/adapters/azure-pronunciation.adapter.ts` — Azure Speech SDK
  - [ ] 12.3 Cập nhật AdapterFactory — thêm pronunciation
  - [ ] 12.4 Cập nhật AiCoreModule — thêm pronunciation config
  - [ ] 12.5 Unit tests

- [ ] 13. Pronunciation Module (lesson-service)
  - [ ] 13.1 Tạo `pronunciation/pronunciation.module.ts`
  - [ ] 13.2 Tạo `pronunciation/pronunciation.service.ts` — assess, constrained STT
  - [ ] 13.3 Implement constrained STT (phrase list / prompt hint)
  - [ ] 13.4 Implement audio level detection
  - [ ] 13.5 Unit tests

## Phase 6: Multi-Channel Orchestrator (Tuần 8-9)

- [ ] 14. Multi-Channel Orchestrator (NestJS)
  - [ ] 14.1 Tạo `lesson/multi-channel-orchestrator.service.ts`
  - [ ] 14.2 Implement `executeTeachStep()` — MQTT ảnh → chờ load → LLM → TTS (VoiceConfig) → WS audio
  - [ ] 14.3 Implement `executePronounceStep()` — MQTT ảnh → TTS prompt → chờ audio → assess
  - [ ] 14.4 Implement `executeQuizStep()` — MQTT options → TTS câu hỏi → chờ answer (race)
  - [ ] 14.5 Implement `executeVoiceQuizStep()` — MQTT ảnh → TTS → STT + Pronunciation song song
  - [ ] 14.6 Implement `waitForAnswer()` — race giữa MQTT touch và WS voice
  - [ ] 14.7 Integration tests

## Phase 7: Session Routing & Scale (Tuần 10)

- [ ] 15. Session Router
  - [ ] 15.1 Tạo `session/session-router.controller.ts` — GET /connect?robot_id=xxx
  - [ ] 15.2 Implement routing: check existing → assign instance ít session nhất
  - [ ] 15.3 Tạo entities: VoiceInstance, ActiveSession
  - [ ] 15.4 Implement heartbeat: voice-streaming instances báo cáo active_count
  - [ ] 15.5 Unit tests

## Phase 8: Integration & Testing (Tuần 11-12)

- [ ] 16. Integration Tests
  - [ ] 16.1 Test full flow: robot connect → Python audio bridge → NestJS orchestrator → lesson complete
  - [ ] 16.2 Test resume flow: disconnect → reconnect → tiếp tục đúng step
  - [ ] 16.3 Test free talk flow: audio → STT → LLM → TTS (custom voice) → audio back
  - [ ] 16.4 Test cache flow: pre-warm → Redis hit → DB hit → LLM fallback → write-back
  - [ ] 16.5 Test multi-channel: MQTT image + WS audio đồng bộ
  - [ ] 16.6 Test timeout/nudge: im lặng → nudge → timeout → advance
  - [ ] 16.7 Test pronunciation pipeline: constrained STT + Azure assessment + cached feedback
  - [ ] 16.8 Test VoiceConfig: course voice > robot voice > system default
  - [ ] 16.9 Load test: 100 concurrent sessions (Python + NestJS)

- [ ] 17. Docker & Deployment
  - [ ] 17.1 Cập nhật `apps/voice-streaming/Dockerfile` — lightweight, chỉ audio bridge
  - [ ] 17.2 Tạo `apps/lesson-service/Dockerfile`
  - [ ] 17.3 Cập nhật `apps/voice-streaming/requirements.txt` — bỏ aiohttp, thêm websockets, opus
  - [ ] 17.4 Docker compose cho local dev (PostgreSQL + Redis + MQTT broker + all services)
  - [ ] 17.5 Tạo deployment scripts (EC2 cho Python, Fargate cho NestJS)

## Phase 9: Monitoring & Analytics (Tuần 13+)

- [ ] 18. Monitoring
  - [ ] 18.1 Session metrics: active sessions, latency per step type
  - [ ] 18.2 Cache metrics: hit rate (Redis/DB/LLM), miss rate
  - [ ] 18.3 LLM metrics: calls/s, latency, cost tracking
  - [ ] 18.4 Pronunciation metrics: average scores per word, per age group
  - [ ] 18.5 Audio bridge metrics: UDP packet loss, WebSocket latency
  - [ ] 18.6 CloudWatch integration

- [ ] 19. Analytics Dashboard Data
  - [ ] 19.1 Query: top 10 từ vựng trẻ hay sai nhất
  - [ ] 19.2 Query: average lesson completion rate
  - [ ] 19.3 Query: average pronunciation score per lesson
  - [ ] 19.4 Query: most used feedback (hit_count từ feedback_cache)
  - [ ] 19.5 Query: session duration distribution
