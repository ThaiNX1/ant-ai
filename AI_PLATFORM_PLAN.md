# AI Platform - Monorepo Migration Plan

## Tổng quan

Xây dựng hệ thống AI Platform dạng monorepo polyglot (Nx), chứa cả Python và NestJS apps trong cùng một repo. Voice Streaming giữ nguyên Python (đã ổn định), các app mới dùng NestJS. Tất cả share chung AI services qua NestJS ai-service (HTTP nội bộ).

---

## 1. Kiến trúc Monorepo (Polyglot)

```
ai-platform/                                ← Nx monorepo (polyglot)
│
├── apps/
│   ├── voice-streaming/                    ← Python (giữ nguyên, refactor nhẹ)
│   │   ├── ai_client/                     ← HTTP client gọi ai-service
│   │   ├── core/                          ← Orchestrator, state, logic (giữ nguyên)
│   │   ├── rtp_handler/                   ← UDP, Opus, bridges (giữ nguyên)
│   │   ├── services/                      ← Refactor: dùng ai_client
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── project.json                   ← Nx project config cho Python app
│   │
│   ├── ai-service/                         ← NestJS: expose AI qua HTTP
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── project.json
│   │
│   ├── customer-service/                   ← NestJS: CSKH (Phase 5+)
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── project.json
│   │
│   └── api-gateway/                        ← NestJS: Gateway chung (optional)
│
├── libs/                                    ← NestJS shared libraries
│   ├── ai-core/                            ← Shared: AI adapters + services
│   ├── database/                           ← Shared: TypeORM + PostgreSQL repositories
│   ├── backend-client/                     ← Shared: HTTP client gọi backend API
│   └── common/                             ← Shared: DTOs, utils, auth, config
│
├── nx.json                                  ← Nx config (polyglot targets)
├── tsconfig.base.json
└── package.json
```

Nx hỗ trợ polyglot qua `project.json` — mỗi app định nghĩa targets riêng (build, serve, test, docker) bất kể ngôn ngữ. Python app dùng custom executor:

```json
// apps/voice-streaming/project.json
{
  "name": "voice-streaming",
  "targets": {
    "serve": { "command": "python main.py", "cwd": "apps/voice-streaming" },
    "test": { "command": "pytest", "cwd": "apps/voice-streaming" },
    "docker-build": { "command": "docker build -t voice-streaming .", "cwd": "apps/voice-streaming" },
    "deploy": { "command": "bash scripts/deploy-ec2.sh", "cwd": "apps/voice-streaming" }
  }
}
```

### Luồng giao tiếp giữa các service

```
┌──────────────────┐                    ┌──────────────────┐
│  Python           │   HTTP (private)  │  NestJS           │
│  voice-streaming  │ ────────────────→ │  ai-service       │
│  (apps/)          │ ←──────────────── │  (apps/)          │
│                   │   audio stream    │  LLM, TTS, STT   │
│  RTP + Opus +     │                   └──────────────────┘
│  Orchestrator     │                            ↑
└──────────────────┘                             │ import AiCoreModule
                                                 │ (in-process, zero latency)
┌──────────────────┐                             │
│  NestJS           │ ───────────────────────────┘
│  customer-service │
│  (apps/)          │
└──────────────────┘
```

- Tất cả apps nằm trong cùng monorepo, quản lý bởi Nx
- Python voice-streaming gọi ai-service qua HTTP nội bộ (private subnet)
- NestJS apps import `AiCoreModule` trực tiếp (in-process)
- Nx dependency graph theo dõi tất cả apps, chỉ build/deploy app bị ảnh hưởng khi code thay đổi

---

## 2. Chi tiết từng Library / App

### 2.1. `libs/common`

Chứa các thành phần dùng chung toàn monorepo.

```
libs/common/src/
├── config/
│   ├── env.config.ts                 ← Load .env, validate biến môi trường
│   └── config.interface.ts           ← Type definitions cho config
├── auth/
│   ├── auth.module.ts
│   ├── auth.guard.ts                 ← SSRC whitelist guard
│   └── auth.service.ts              ← Quản lý whitelist (tương đương AuthManager)
├── dto/
│   ├── student-profile.dto.ts
│   ├── lesson.dto.ts
│   └── session.dto.ts
├── utils/
│   ├── json-parser.util.ts          ← Parse JSON từ model output
│   └── text.util.ts                 ← Normalize text, extract assistant_message
├── interfaces/
│   └── build-info.interface.ts
└── index.ts
```

### 2.2. `libs/ai-core`

Shared AI service layer. Đây là lib quan trọng nhất, mọi app đều dùng.

```
libs/ai-core/src/
├── interfaces/
│   ├── llm.interface.ts              ← Abstract: generate(), generateStream()
│   ├── tts.interface.ts              ← Abstract: synthesize(), streamSynthesize()
│   ├── stt.interface.ts              ← Abstract: transcribeAudio()
│   ├── realtime.interface.ts         ← Abstract: connect(), feedAudio(), getResponseStream()...
│   └── ai-core-options.interface.ts  ← Config type cho DynamicModule
├── adapters/
│   ├── gemini-llm.adapter.ts         ← Google Gemini (gemini-2.5-flash-lite)
│   ├── openai-stt.adapter.ts         ← OpenAI Whisper (gpt-4o-mini-transcribe)
│   ├── openai-realtime.adapter.ts    ← OpenAI Realtime API (gpt-realtime-1.5)
│   ├── elevenlabs-tts.adapter.ts     ← ElevenLabs (eleven_v3)
│   └── adapter.factory.ts            ← Factory tạo adapter theo provider name
├── services/
│   ├── llm.service.ts                ← Wrap LLM adapter, async generate + stream
│   ├── tts.service.ts                ← Wrap TTS adapter, stream audio chunks
│   ├── stt.service.ts                ← Wrap STT adapter, transcribe bytes
│   ├── realtime-voice.service.ts     ← Wrap Realtime adapter, manual trigger mode
│   ├── voice-to-voice.service.ts     ← Pipeline: Realtime STT → TTS streaming
│   └── text-to-voice.service.ts      ← Pipeline: LLM generate → TTS streaming
├── constants/
│   └── injection-tokens.ts           ← LLM_ADAPTER, TTS_ADAPTER, STT_ADAPTER...
├── ai-core.module.ts                 ← NestJS Dynamic Module: AiCoreModule.register()
└── index.ts
```

Cách sử dụng:

```typescript
// Bất kỳ app nào cũng import như sau:
AiCoreModule.register({
  llm: { provider: 'gemini', model: 'gemini-2.5-flash-lite', apiKey: '...' },
  tts: { provider: 'elevenlabs', model: 'eleven_v3', apiKey: '...' },
  realtime: { provider: 'openai', model: 'gpt-realtime-1.5', apiKey: '...' },
})
```

### 2.3. `libs/database`

TypeORM + PostgreSQL repository layer.

```
libs/database/src/
├── entities/
│   ├── student.entity.ts
│   ├── lesson.entity.ts
│   ├── learning-session.entity.ts
│   └── companion-session.entity.ts
├── repositories/
│   ├── student.repository.ts
│   ├── lesson.repository.ts
│   ├── learning-session.repository.ts
│   ├── companion-session.repository.ts
│   └── repository.interfaces.ts
├── database.module.ts                ← DatabaseModule.register({ host, port, username, password, database })
├── database.service.ts              ← Tương đương DatabaseManager
└── index.ts
```

### 2.4. `libs/backend-client`

HTTP client gọi backend API bên ngoài.

```
libs/backend-client/src/
├── backend.client.ts                 ← getAccountAndDeviceInfo(), getLessonStatus()
├── backend-device.client.ts          ← streamFileFromCache() (hiển thị ảnh lên robot)
├── backend-client.module.ts
└── index.ts
```

### 2.5. `apps/ai-service`

NestJS microservice expose AI capabilities qua HTTP cho Python voice-streaming.

```
apps/ai-service/src/
├── llm/
│   └── llm.controller.ts            ← POST /llm/generate, POST /llm/generate-stream (SSE)
├── tts/
│   └── tts.controller.ts            ← POST /tts/synthesize-stream (chunked response)
├── stt/
│   └── stt.controller.ts            ← POST /stt/transcribe
├── realtime/
│   └── realtime.gateway.ts          ← WebSocket gateway proxy OpenAI Realtime
├── health/
│   └── health.controller.ts
├── app.module.ts                     ← Import AiCoreModule.register({...})
└── main.ts
```

### 2.6. `apps/voice-streaming` (Python - trong monorepo)

Python app nằm trong `apps/`, quản lý bởi Nx qua `project.json` với custom targets.

Refactor nhẹ từ project hiện tại:
- Thêm `ai_client/`: HTTP client gọi sang NestJS ai-service
- Refactor `services/`: dùng ai_client thay vì gọi trực tiếp AI APIs
- Giữ nguyên 100%: `rtp_handler/`, `core/`, `config.py`, `main.py`

```
apps/voice-streaming/
├── ai_client/
│   ├── __init__.py
│   ├── ai_service_client.py          ← Base HTTP client (aiohttp)
│   ├── llm_client.py                 ← generate(), generate_stream()
│   ├── tts_client.py                 ← stream_synthesize()
│   └── realtime_client.py            ← WebSocket proxy
├── core/                              ← GIỮ NGUYÊN
│   ├── orchestrator.py
│   ├── state.py
│   ├── logic_processor.py
│   ├── prompt_builder.py
│   └── ...
├── rtp_handler/                       ← GIỮ NGUYÊN
├── services/                          ← Refactor nhẹ: dùng ai_client
├── config.py
├── main.py
├── requirements.txt
├── Dockerfile
└── project.json                       ← Nx project config
```

### 2.7. `apps/customer-service` (Phase 5+)

```
apps/customer-service/src/
├── ticket/                           ← Quản lý ticket CSKH
├── chat/                             ← Chat với khách hàng (dùng LlmService từ ai-core)
├── knowledge-base/                   ← RAG cho CSKH
├── app.module.ts                     ← Import AiCoreModule.register({...})
└── main.ts
```

---

## 3. Tech Stack

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Monorepo tool | Nx | NestJS generator sẵn, dependency graph, build cache |
| Framework | NestJS 10+ | TypeScript, DI, modular |
| HTTP server | Fastify | Nhanh hơn Express, NestJS hỗ trợ native |
| WebSocket | ws | Cho OpenAI Realtime API proxy |
| Database | TypeORM + PostgreSQL | @nestjs/typeorm, pg driver, repository pattern |
| HTTP client | axios hoặc undici | Gọi backend API |
| Config | @nestjs/config + joi | Validate env vars |
| Logging | nestjs-pino hoặc winston | Structured logging |
| Testing | Jest + supertest | Unit + integration |
| Voice streaming | Python (giữ nguyên) | asyncio, UDP/RTP, Opus, scipy |
| Giao tiếp Python ↔ NestJS | HTTP (aiohttp client) | Private subnet, low latency |

---

## 4. Phân chia Phase & Timeline

### Phase 1: Foundation (Tuần 1-2)

**Mục tiêu:** Monorepo skeleton + shared libs cơ bản.

| Task | Thời gian | Chi tiết |
|------|-----------|----------|
| 1.1 Init Nx workspace | 0.5 ngày | `npx create-nx-workspace ai-platform --preset=nest` |
| 1.2 Tạo libs/common | 1 ngày | Config loader, env validation, DTOs, utils |
| 1.3 Tạo libs/ai-core interfaces | 1 ngày | 4 interface files (LLM, TTS, STT, Realtime) |
| 1.4 Implement Gemini LLM adapter | 1 ngày | generate(), generateStream() |
| 1.5 Implement ElevenLabs TTS adapter | 1 ngày | synthesize(), streamSynthesize() |
| 1.6 Implement OpenAI STT adapter | 0.5 ngày | transcribeAudio() |
| 1.7 Implement OpenAI Realtime adapter | 2 ngày | WebSocket, manual trigger, transcript |
| 1.8 AiCoreModule dynamic module + factory | 1 ngày | register(), injection tokens |
| 1.9 Unit tests cho adapters | 1 ngày | Mock API calls |

**Deliverable:** `libs/ai-core` hoàn chỉnh, có thể import vào bất kỳ app nào.

### Phase 2: Data Layer (Tuần 3-4)

**Mục tiêu:** Database + backend client sẵn sàng.

| Task | Thời gian | Chi tiết |
|------|-----------|----------|
| 2.1 Tạo libs/database | 1.5 ngày | TypeORM module, entities, 4 repositories |
| 2.2 DatabaseService (DatabaseManager) | 1.5 ngày | CRUD, load bundles, ensure entities |
| 2.3 Tạo libs/backend-client | 1.5 ngày | BackendClient, BackendDeviceClient |
| 2.4 Integration test với PostgreSQL | 1 ngày | Test thật với DB |
| 2.5 Pipeline services (V2V, T2V) | 2 ngày | VoiceToVoiceService, TextToVoiceService |
| 2.6 Test pipeline end-to-end | 1.5 ngày | LLM → TTS → audio bytes |

**Deliverable:** Toàn bộ shared libs hoàn chỉnh, tested.

### Phase 3: AI Service App (Tuần 5-6)

**Mục tiêu:** NestJS microservice expose AI qua HTTP cho Python voice-streaming.

| Task | Thời gian | Chi tiết |
|------|-----------|----------|
| 3.1 Scaffold ai-service app | 0.5 ngày | `nx g @nx/nest:app ai-service` |
| 3.2 LLM controller | 1 ngày | POST /llm/generate, SSE /llm/generate-stream |
| 3.3 TTS controller | 1 ngày | POST /tts/synthesize-stream (chunked audio) |
| 3.4 STT controller | 0.5 ngày | POST /stt/transcribe |
| 3.5 Realtime WebSocket gateway | 2 ngày | Proxy OpenAI Realtime, session management |
| 3.6 Health check + monitoring | 0.5 ngày | /health, /metrics |
| 3.7 Integration test | 1.5 ngày | Test tất cả endpoints end-to-end |
| 3.8 Docker build + config | 1 ngày | Dockerfile, env vars, Fargate-ready |

**Deliverable:** ai-service chạy độc lập, sẵn sàng nhận request từ Python.

### Phase 4: Python Voice-Streaming Refactor (Tuần 7-8)

**Mục tiêu:** Refactor Python app gọi ai-service thay vì gọi trực tiếp AI APIs.

| Task | Thời gian | Chi tiết |
|------|-----------|----------|
| 4.1 Tạo ai_client module | 1.5 ngày | HTTP client (aiohttp) gọi ai-service |
| 4.2 Refactor VoiceToVoiceService | 2 ngày | Dùng ai_client.realtime thay OpenAI adapter trực tiếp |
| 4.3 Refactor TextToVoiceService | 1.5 ngày | Dùng ai_client.llm + ai_client.tts |
| 4.4 Xóa adapters cũ | 0.5 ngày | Bỏ adapters/implementations/, factory |
| 4.5 Integration test | 2 ngày | Full flow: Python ↔ ai-service ↔ AI providers |
| 4.6 Performance test | 1 ngày | So sánh latency trước/sau refactor |
| 4.7 Docker build cập nhật | 0.5 ngày | Cập nhật Dockerfile, requirements.txt |
| 4.8 Bug fixing | 1 ngày | Edge cases, timeout handling |

**Deliverable:** Python voice-streaming hoạt động qua ai-service, latency chấp nhận được (thêm < 20ms).

### Phase 5: Customer Service App (Tuần 11+)

**Mục tiêu:** App CSKH, reuse ai-core.

| Task | Thời gian | Chi tiết |
|------|-----------|----------|
| 5.1 Scaffold app | 0.5 ngày | `nx g @nx/nest:app customer-service` |
| 5.2 Import AiCoreModule | 0.5 ngày | Config cho use case CSKH |
| 5.3 Business modules | Tùy scope | Ticket, chat, knowledge base... |

**Deliverable:** App CSKH dùng chung AI services, không viết lại adapter nào.

---

## 5. Rủi ro & Giải pháp

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| Latency tăng do network hop (Python → ai-service) | Trung bình | Cùng private subnet, latency thêm ~5-15ms. Chấp nhận được cho voice. Nếu cần, dùng Unix socket hoặc gRPC |
| OpenAI Realtime WebSocket proxy phức tạp | Cao | Cân nhắc giữ Python gọi trực tiếp OpenAI Realtime, chỉ proxy LLM + TTS qua ai-service |
| ai-service downtime ảnh hưởng voice-streaming | Cao | Health check, auto-restart (ECS), circuit breaker trong Python client |
| Race condition trong orchestrator | Trung bình | Giữ nguyên asyncio.Lock() trong Python (đã hoạt động) |
| Monorepo build chậm khi lớn | Thấp | Nx remote cache, affected commands chỉ build/test phần thay đổi |
| Đồng bộ API contract Python ↔ NestJS | Trung bình | Định nghĩa OpenAPI spec cho ai-service, generate Python client từ spec |

---

## 6. Dependencies chính (package.json)

```json
{
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/platform-fastify": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.11.0",
    "@google/generative-ai": "^0.20.0",
    "openai": "^4.0.0",
    "elevenlabs": "^1.0.0",
    "ws": "^8.0.0",
    "axios": "^1.6.0",
    "joi": "^17.0.0",
    "rxjs": "^7.0.0"
  },
  "devDependencies": {
    "@nx/nest": "latest",
    "@nx/js": "latest",
    "jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 7. Tiêu chí hoàn thành (Definition of Done)

- [ ] Monorepo Nx build thành công, tất cả libs export đúng
- [ ] `libs/ai-core`: 4 adapters hoạt động, unit test pass
- [ ] `libs/database`: CRUD TypeORM + PostgreSQL hoạt động
- [ ] `apps/ai-service`: Tất cả endpoints hoạt động, health check pass
- [ ] Python voice-streaming gọi ai-service thành công, latency thêm < 20ms
- [ ] Full voice flow: READY → speak → AI response → audio playback (qua ai-service)
- [ ] Concurrent sessions: ≥ 20 sessions đồng thời không lỗi
- [ ] Audio quality: Không artifact, pacing đúng real-time
- [ ] Latency: Từ lúc user ngừng nói → nghe AI trả lời < 2.5 giây
- [ ] `apps/customer-service`: Import AiCoreModule thành công, gọi LLM/TTS được
- [ ] Deployment: Tất cả services chạy ổn định trên AWS

---

## 8. Triển khai AWS (Deployment)

### 8.1. Tổng quan kiến trúc triển khai

```
                              Internet
                                 │
                    ┌────────────┴────────────┐
                    │     ALB (HTTPS:443)      │
                    │   Path-based routing     │
                    └────┬──────┬──────┬──────┘
                         │      │      │
            ┌────────────┘      │      └────────────┐
            ▼                   ▼                    ▼
  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
  │  ECS Fargate     │ │  ECS Fargate     │ │  ECS Fargate     │
  │  ai-service      │ │  customer-svc    │ │  api-gateway     │
  │  (NestJS)        │ │  (NestJS)        │ │  (NestJS)        │
  │  /ai/*           │ │  /cs/*           │ │  /api/*          │
  │  Private Subnet  │ │  Private Subnet  │ │  Private Subnet  │
  └──────────────────┘ └──────────────────┘ └──────────────────┘
            ▲
            │ HTTP (private network, ~5ms)
            │
  ┌──────────────────┐
  │  EC2              │ ◄──── UDP từ robot clients
  │  voice-streaming  │       RTP Port 5004
  │  (Python)         │       Control Port 7000
  │                   │
  │  Elastic IP       │ ← IP cố định cho RTP
  │  Public Subnet    │
  └──────────────────┘
            │
            ▼
  ┌──────────────────┐
  │  PostgreSQL (RDS) │ ← Managed database
  └──────────────────┘
```

### 8.2. Tại sao voice-streaming phải chạy trên EC2

| Yêu cầu | Fargate | EC2 |
|----------|---------|-----|
| UDP port cố định (5004, 7000) | Không hỗ trợ UDP tùy ý | Toàn quyền |
| Elastic IP (IP cố định cho RTP client) | IP thay đổi mỗi deploy | Gắn Elastic IP |
| NAT hole-punching (bind source IP/port) | Không control được | Toàn quyền bind socket |
| Stateful sessions (audio buffer trong RAM) | Không phù hợp scale horizontal | Phù hợp, 1 instance giữ state |

### 8.3. Chi tiết cấu hình từng service

#### EC2 - Python voice-streaming

```
Instance type:      c6i.xlarge (4 vCPU, 8GB RAM)
                    Hoặc c6i.2xlarge nếu > 50 concurrent sessions
AMI:                Amazon Linux 2023
Subnet:             Public subnet (cần Elastic IP cho RTP)
Elastic IP:         1 (IP cố định cho robot clients kết nối)

Security Group (Inbound):
  - UDP 5004        ← RTP audio từ robot clients
  - UDP 7000        ← Control channel từ robot clients
  - TCP 8081        ← HTTP API (chỉ từ ALB hoặc internal)
  - TCP 22          ← SSH (chỉ từ bastion/VPN)

Security Group (Outbound):
  - All traffic     ← Gọi ai-service, PostgreSQL, backend API

Deploy method:      Docker container + docker-compose
                    Hoặc systemd service + supervisord
Auto-recovery:      EC2 auto-recovery (CloudWatch alarm)
```

#### ECS Fargate - NestJS ai-service

```
CPU:                1 vCPU
Memory:             2 GB
Desired count:      2 (HA, multi-AZ)
Max count:          6 (auto-scale theo CPU > 70%)
Subnet:             Private subnet
Service discovery:  AWS Cloud Map (ai-service.internal)

ALB Target Group:
  - Path pattern:   /ai/*
  - Health check:   GET /ai/health
  - Port:           8081

Security Group (Inbound):
  - TCP 8081        ← Chỉ từ ALB + EC2 voice-streaming security group

Environment Variables:
  - GEMINI_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY
  - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
```

#### ECS Fargate - NestJS customer-service

```
CPU:                0.5 vCPU
Memory:             1 GB
Desired count:      1
Max count:          4 (auto-scale theo request count)
Subnet:             Private subnet

ALB Target Group:
  - Path pattern:   /cs/*
  - Health check:   GET /cs/health
  - Port:           8082
```

### 8.4. Networking (VPC)

```
VPC: 10.0.0.0/16
│
├── Public Subnets (cho ALB + EC2 voice-streaming)
│   ├── 10.0.1.0/24    ← AZ-a: EC2 voice-streaming + Elastic IP
│   └── 10.0.2.0/24    ← AZ-b: (backup EC2 nếu cần HA)
│
├── Private Subnets (cho ECS Fargate)
│   ├── 10.0.10.0/24   ← AZ-a: Fargate tasks
│   └── 10.0.11.0/24   ← AZ-b: Fargate tasks
│
├── NAT Gateway        ← 1 NAT GW ở public subnet, cho Fargate gọi internet
│                        (OpenAI, Gemini, ElevenLabs APIs)
│
└── ALB                ← Public subnets, route tới private subnets
```

### 8.5. High Availability cho voice-streaming

Vì voice-streaming stateful (session trong RAM), không thể dùng ALB load balance đơn giản.

Phương án nếu cần HA:

```
Phương án A: Active-Passive
  EC2-A (primary):   Chạy chính, Elastic IP gắn vào
  EC2-B (standby):   Chờ sẵn, CloudWatch detect EC2-A fail → chuyển Elastic IP sang EC2-B
  Downtime:          ~30-60 giây khi failover

Phương án B: Sharding theo SSRC
  EC2-A:             Xử lý SSRC chẵn
  EC2-B:             Xử lý SSRC lẻ
  Routing:           API Gateway lookup SSRC → trả IP tương ứng
  Downtime:          Chỉ 50% clients bị ảnh hưởng khi 1 node fail
```

Khuyến nghị bắt đầu với 1 EC2 + auto-recovery. Khi scale lên > 100 concurrent sessions mới cần sharding.

### 8.6. CI/CD Pipeline

```
ai-platform/ (monorepo)
         │
         ├── Push to main
         │
         ▼
  GitHub Actions / Jenkins
         │
         ├── nx affected:build    ← Chỉ build apps bị ảnh hưởng
         ├── nx affected:test     ← Chỉ test apps bị ảnh hưởng
         │
    ┌────┴──────────────────────────┐
    │                               │
    ▼                               ▼
  NestJS apps                     Python voice-streaming
  (ai-service, customer-svc)      (apps/voice-streaming)
    │                               │
    ├── docker build                ├── docker build
    ├── docker push → ECR           ├── docker push → ECR
    └── aws ecs update-service      └── SSH → EC2: docker pull + restart
        (rolling, zero-downtime)       (hoặc CodeDeploy)
```

Lợi ích monorepo: `nx affected` tự detect app nào bị ảnh hưởng bởi commit, chỉ build/deploy app đó. Ví dụ sửa `libs/ai-core` → rebuild + deploy cả ai-service lẫn customer-service, nhưng không động tới voice-streaming.

### 8.7. Monitoring & Logging

```
CloudWatch Logs:
  - /ecs/ai-service           ← NestJS logs (structured JSON via pino)
  - /ecs/customer-service
  - /ec2/voice-streaming      ← Python logs (CloudWatch Agent)

CloudWatch Metrics:
  - ECS: CPU, Memory, Request count, Response time
  - EC2: CPU, Memory, Network I/O, UDP packet count
  - Custom: Active sessions, Latency per turn, AI API response time

CloudWatch Alarms:
  - EC2 CPU > 80% sustained 5 min     → SNS notification
  - EC2 StatusCheckFailed              → Auto-recovery
  - ECS task count < desired           → SNS notification
  - ai-service response time > 500ms  → SNS notification
```

### 8.8. Ước tính chi phí hàng tháng

| Resource | Spec | Chi phí ước tính |
|----------|------|-----------------|
| EC2 c6i.xlarge (voice-streaming) | 1 instance, on-demand | ~$125/tháng |
| EC2 Reserved Instance (1 năm) | Thay thế on-demand | ~$75/tháng |
| Elastic IP | 1 | ~$3.6/tháng |
| ECS Fargate (ai-service) | 2 tasks × 1vCPU/2GB | ~$60/tháng |
| ECS Fargate (customer-service) | 1 task × 0.5vCPU/1GB | ~$15/tháng |
| ALB | 1 | ~$22/tháng |
| NAT Gateway | 1 + data transfer | ~$35/tháng |
| ECR | Docker image storage | ~$5/tháng |
| CloudWatch | Logs + metrics + alarms | ~$15/tháng |
| **Tổng (on-demand)** | | **~$280-320/tháng** |
| **Tổng (reserved EC2)** | | **~$230-270/tháng** |

Chưa bao gồm chi phí API calls (OpenAI, Gemini, ElevenLabs) — đây là biến phí theo usage.

### 8.9. Thứ tự triển khai

```
Bước 1: Tạo VPC, subnets, security groups, ALB
Bước 2: Deploy ai-service lên ECS Fargate, test health check
Bước 3: Deploy Python voice-streaming lên EC2, gắn Elastic IP
Bước 4: Kết nối voice-streaming → ai-service (private subnet)
Bước 5: Test end-to-end với robot client thật
Bước 6: Setup CI/CD pipeline
Bước 7: Setup monitoring + alarms
Bước 8: Deploy customer-service khi sẵn sàng (Phase 5)
```
