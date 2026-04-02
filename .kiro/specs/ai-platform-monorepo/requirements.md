# Tài liệu Yêu cầu - AI Platform Monorepo

## Giới thiệu

Xây dựng hệ thống AI Platform dạng monorepo polyglot sử dụng Nx, chứa cả Python và NestJS apps trong cùng một repository. Hệ thống bao gồm: voice-streaming (Python, giữ nguyên), ai-service (NestJS microservice expose AI qua HTTP), customer-service (NestJS CSKH), cùng các shared libraries (ai-core, database, backend-client, common). Tất cả NestJS apps chia sẻ AI services qua thư viện ai-core, Python voice-streaming gọi ai-service qua HTTP nội bộ trong private subnet.

## Thuật ngữ

- **Monorepo**: Repository đơn chứa toàn bộ mã nguồn của nhiều ứng dụng và thư viện liên quan
- **Nx**: Công cụ quản lý monorepo hỗ trợ polyglot, dependency graph, build cache và affected commands
- **AiCoreModule**: NestJS Dynamic Module cung cấp các AI adapter (LLM, TTS, STT, Realtime) cho mọi app trong monorepo
- **AI_Service**: NestJS microservice expose các khả năng AI (LLM, TTS, STT, Realtime) qua HTTP/WebSocket cho các client không phải NestJS
- **Voice_Streaming**: Ứng dụng Python xử lý voice streaming real-time qua RTP/UDP, giao tiếp với robot clients
- **Customer_Service**: Ứng dụng NestJS phục vụ chăm sóc khách hàng (CSKH), sử dụng AiCoreModule trực tiếp
- **LLM_Adapter**: Adapter trừu tượng cho Large Language Model, hiện tại dùng Google Gemini
- **TTS_Adapter**: Adapter trừu tượng cho Text-to-Speech, hiện tại dùng ElevenLabs
- **STT_Adapter**: Adapter trừu tượng cho Speech-to-Text, hiện tại dùng OpenAI Whisper
- **Realtime_Adapter**: Adapter trừu tượng cho OpenAI Realtime API (voice-to-voice qua WebSocket)
- **TypeORM**: ORM (Object-Relational Mapping) cho TypeScript/JavaScript, hỗ trợ repository pattern và migration
- **PostgreSQL**: Hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở, sử dụng làm tầng lưu trữ dữ liệu
- **Backend_Client**: HTTP client gọi backend API bên ngoài để lấy thông tin tài khoản, thiết bị, bài học
- **ALB**: Application Load Balancer trên AWS, thực hiện path-based routing tới các service
- **Fargate**: AWS ECS Fargate, chạy container serverless cho các NestJS service
- **Private_Subnet**: Mạng con riêng tư trong VPC, không truy cập trực tiếp từ internet
- **Adapter_Factory**: Factory pattern tạo adapter theo tên provider được cấu hình

## Yêu cầu

### Yêu cầu 1: Khởi tạo Nx Monorepo Polyglot

**User Story:** Là một developer, tôi muốn có một monorepo Nx polyglot chứa cả Python và NestJS apps, để quản lý toàn bộ mã nguồn tập trung với dependency graph và build cache.

#### Tiêu chí chấp nhận

1. THE Monorepo SHALL sử dụng Nx làm công cụ quản lý với cấu hình polyglot hỗ trợ cả NestJS và Python projects
2. WHEN một NestJS app được tạo mới, THE Monorepo SHALL cấu hình project.json với các targets: build, serve, test, lint, docker-build
3. WHEN một Python app được thêm vào, THE Monorepo SHALL cấu hình project.json với custom targets: serve, test, docker-build, deploy sử dụng lệnh shell tương ứng
4. THE Monorepo SHALL có cấu trúc thư mục gồm apps/ chứa các ứng dụng và libs/ chứa các thư viện dùng chung
5. WHEN mã nguồn trong libs/ thay đổi, THE Nx SHALL xác định chính xác các apps bị ảnh hưởng thông qua dependency graph

### Yêu cầu 2: Thư viện Common (libs/common)

**User Story:** Là một developer, tôi muốn có thư viện common chứa config, auth, DTOs và utils dùng chung, để tránh trùng lặp mã nguồn giữa các apps.

#### Tiêu chí chấp nhận

1. THE Common_Library SHALL cung cấp module config loader đọc và validate biến môi trường sử dụng joi schema
2. IF biến môi trường bắt buộc bị thiếu hoặc không hợp lệ, THEN THE Common_Library SHALL throw lỗi mô tả rõ biến nào bị thiếu hoặc sai định dạng
3. THE Common_Library SHALL cung cấp AuthGuard xác thực request dựa trên SSRC whitelist
4. THE Common_Library SHALL export các DTO classes: StudentProfileDto, LessonDto, SessionDto với validation decorators
5. THE Common_Library SHALL cung cấp utility functions: json-parser (parse JSON từ model output) và text utilities (normalize text, extract assistant_message)
6. WHEN một app import Common_Library, THE Common_Library SHALL export tất cả public APIs qua barrel file index.ts

### Yêu cầu 3: Thư viện AI Core (libs/ai-core)

**User Story:** Là một developer, tôi muốn có thư viện ai-core cung cấp các AI adapter và services dùng chung, để mọi app đều có thể sử dụng LLM, TTS, STT, Realtime mà không cần viết lại.

#### Tiêu chí chấp nhận

1. THE AiCoreModule SHALL định nghĩa 4 abstract interfaces: LLM_Interface (generate, generateStream), TTS_Interface (synthesize, streamSynthesize), STT_Interface (transcribeAudio), Realtime_Interface (connect, feedAudio, getResponseStream)
2. THE AiCoreModule SHALL cung cấp concrete adapters: Gemini_LLM_Adapter, ElevenLabs_TTS_Adapter, OpenAI_STT_Adapter, OpenAI_Realtime_Adapter
3. THE AiCoreModule SHALL là NestJS Dynamic Module với phương thức register() nhận cấu hình provider, model và apiKey cho từng loại adapter
4. THE Adapter_Factory SHALL tạo đúng adapter instance dựa trên tên provider được truyền vào cấu hình
5. WHEN một adapter được inject qua DI, THE AiCoreModule SHALL sử dụng injection tokens (LLM_ADAPTER, TTS_ADAPTER, STT_ADAPTER, REALTIME_ADAPTER) để phân biệt các adapter
6. THE AiCoreModule SHALL cung cấp pipeline services: VoiceToVoiceService (Realtime STT → TTS streaming) và TextToVoiceService (LLM generate → TTS streaming)
7. IF một AI provider API trả về lỗi, THEN THE adapter tương ứng SHALL throw exception có chứa mã lỗi, thông điệp mô tả và tên provider gây lỗi

### Yêu cầu 4: Thư viện Database (libs/database)

**User Story:** Là một developer, tôi muốn có thư viện database cung cấp TypeORM + PostgreSQL repository layer dùng chung, để các apps truy cập dữ liệu thống nhất.

#### Tiêu chí chấp nhận

1. THE Database_Module SHALL là NestJS Dynamic Module với phương thức register() nhận PostgreSQL connection options (host, port, username, password, database)
2. THE Database_Module SHALL cung cấp các repositories: StudentRepository, LessonRepository, LearningSessionRepository, CompanionSessionRepository sử dụng TypeORM repository pattern
3. THE DatabaseService SHALL cung cấp các thao tác CRUD, load bundles và ensure entities tương đương DatabaseManager hiện tại
4. IF kết nối PostgreSQL thất bại, THEN THE Database_Module SHALL throw lỗi mô tả rõ nguyên nhân (host không đúng, credentials không hợp lệ, timeout)
5. WHEN một repository thực hiện query, THE repository đó SHALL sử dụng TypeORM repositories (@nestjs/typeorm) để tương tác với PostgreSQL database

### Yêu cầu 5: Thư viện Backend Client (libs/backend-client)

**User Story:** Là một developer, tôi muốn có thư viện backend-client cung cấp HTTP client gọi backend API bên ngoài, để lấy thông tin tài khoản, thiết bị và bài học.

#### Tiêu chí chấp nhận

1. THE Backend_Client SHALL cung cấp BackendClient với các phương thức: getAccountAndDeviceInfo(), getLessonStatus()
2. THE Backend_Client SHALL cung cấp BackendDeviceClient với phương thức streamFileFromCache() để hiển thị ảnh lên robot
3. THE Backend_Client_Module SHALL là NestJS module có thể cấu hình base URL và authentication headers
4. IF backend API trả về HTTP error (4xx, 5xx), THEN THE Backend_Client SHALL throw exception chứa HTTP status code và response body
5. IF backend API không phản hồi trong thời gian timeout được cấu hình, THEN THE Backend_Client SHALL throw timeout exception

### Yêu cầu 6: Ứng dụng AI Service (apps/ai-service)

**User Story:** Là một developer, tôi muốn có NestJS microservice expose AI capabilities qua HTTP/WebSocket, để Python voice-streaming và các client khác có thể sử dụng AI services.

#### Tiêu chí chấp nhận

1. THE AI_Service SHALL expose endpoint POST /llm/generate nhận text prompt và trả về kết quả LLM generation
2. THE AI_Service SHALL expose endpoint POST /llm/generate-stream trả về kết quả LLM generation dạng Server-Sent Events (SSE)
3. THE AI_Service SHALL expose endpoint POST /tts/synthesize-stream nhận text và trả về audio chunks dạng chunked response
4. THE AI_Service SHALL expose endpoint POST /stt/transcribe nhận audio bytes và trả về text transcription
5. THE AI_Service SHALL expose WebSocket gateway tại /realtime để proxy kết nối OpenAI Realtime API với quản lý session
6. THE AI_Service SHALL expose endpoint GET /health trả về trạng thái hoạt động của service
7. THE AI_Service SHALL sử dụng Fastify làm HTTP server thay vì Express
8. THE AI_Service SHALL import AiCoreModule.register() với cấu hình từ biến môi trường
9. IF một request tới AI_Service thiếu trường bắt buộc, THEN THE AI_Service SHALL trả về HTTP 400 với thông báo validation error cụ thể

### Yêu cầu 7: Refactor Python Voice-Streaming (apps/voice-streaming)

**User Story:** Là một developer, tôi muốn refactor Python voice-streaming để gọi AI services qua ai-service HTTP thay vì gọi trực tiếp AI provider APIs, để tập trung logic AI vào một nơi duy nhất.

#### Tiêu chí chấp nhận

1. THE Voice_Streaming SHALL có module ai_client chứa HTTP client (aiohttp) gọi tới AI_Service
2. THE ai_client SHALL cung cấp các client: LlmClient (generate, generate_stream), TtsClient (stream_synthesize), RealtimeClient (WebSocket proxy)
3. WHEN Voice_Streaming cần gọi AI, THE Voice_Streaming SHALL sử dụng ai_client thay vì gọi trực tiếp tới OpenAI, Gemini hoặc ElevenLabs APIs
4. THE Voice_Streaming SHALL giữ nguyên toàn bộ mã nguồn trong core/ (orchestrator, state, logic_processor) và rtp_handler/ (UDP, Opus, bridges)
5. WHEN Voice_Streaming gọi AI_Service qua HTTP trong cùng private subnet, THE latency thêm vào SHALL dưới 20ms
6. IF AI_Service không phản hồi hoặc trả về lỗi, THEN THE ai_client SHALL thực hiện retry với exponential backoff và circuit breaker
7. THE Voice_Streaming SHALL được quản lý bởi Nx qua project.json với custom targets phù hợp Python

### Yêu cầu 8: Ứng dụng Customer Service (apps/customer-service)

**User Story:** Là một developer, tôi muốn có ứng dụng NestJS customer-service cho chăm sóc khách hàng, tái sử dụng ai-core mà không cần viết lại adapter nào.

#### Tiêu chí chấp nhận

1. THE Customer_Service SHALL import AiCoreModule.register() với cấu hình phù hợp use case CSKH
2. THE Customer_Service SHALL có các business modules: ticket (quản lý ticket), chat (chat với khách hàng sử dụng LLM), knowledge-base (RAG cho CSKH)
3. WHEN Customer_Service cần gọi LLM hoặc TTS, THE Customer_Service SHALL sử dụng services từ AiCoreModule trực tiếp (in-process) mà không qua HTTP
4. THE Customer_Service SHALL expose endpoint GET /cs/health trả về trạng thái hoạt động

### Yêu cầu 9: Triển khai AWS

**User Story:** Là một DevOps engineer, tôi muốn triển khai toàn bộ hệ thống lên AWS với kiến trúc phù hợp từng loại service, để đảm bảo hiệu năng và độ ổn định.

#### Tiêu chí chấp nhận

1. THE Voice_Streaming SHALL được triển khai trên EC2 instance (c6i.xlarge) trong public subnet với Elastic IP cố định cho RTP clients kết nối
2. THE AI_Service SHALL được triển khai trên ECS Fargate trong private subnet với tối thiểu 2 tasks (multi-AZ) cho high availability
3. THE Customer_Service SHALL được triển khai trên ECS Fargate trong private subnet
4. THE ALB SHALL thực hiện path-based routing: /ai/* tới AI_Service, /cs/* tới Customer_Service
5. THE VPC SHALL có public subnets (cho ALB và EC2) và private subnets (cho ECS Fargate) với NAT Gateway cho Fargate truy cập internet
6. WHEN EC2 instance chạy Voice_Streaming gặp StatusCheckFailed, THE CloudWatch SHALL tự động recovery instance đó
7. WHEN CPU của ECS Fargate AI_Service vượt quá 70% trong 5 phút, THE ECS auto-scaling SHALL tăng số tasks lên tối đa 6 tasks
8. THE Security_Group của AI_Service SHALL chỉ cho phép inbound TCP 8081 từ ALB và EC2 Voice_Streaming security group
9. THE Security_Group của EC2 Voice_Streaming SHALL cho phép inbound UDP 5004 (RTP) và UDP 7000 (control) từ robot clients

### Yêu cầu 10: CI/CD Pipeline

**User Story:** Là một DevOps engineer, tôi muốn có CI/CD pipeline tự động build và deploy chỉ các apps bị ảnh hưởng khi code thay đổi, để tiết kiệm thời gian và tài nguyên.

#### Tiêu chí chấp nhận

1. WHEN code được push lên nhánh main, THE CI_Pipeline SHALL chạy nx affected:build và nx affected:test để chỉ build và test các apps bị ảnh hưởng
2. WHEN NestJS apps (AI_Service, Customer_Service) cần deploy, THE CI_Pipeline SHALL build Docker image, push lên ECR và thực hiện ECS rolling update (zero-downtime)
3. WHEN Voice_Streaming cần deploy, THE CI_Pipeline SHALL build Docker image, push lên ECR và thực hiện docker pull + restart trên EC2
4. IF build hoặc test thất bại, THEN THE CI_Pipeline SHALL dừng pipeline và thông báo lỗi

### Yêu cầu 11: Monitoring và Logging

**User Story:** Là một DevOps engineer, tôi muốn có hệ thống monitoring và logging tập trung, để theo dõi sức khỏe và hiệu năng của toàn bộ hệ thống.

#### Tiêu chí chấp nhận

1. THE NestJS apps SHALL ghi structured logs dạng JSON sử dụng nestjs-pino hoặc winston, đẩy vào CloudWatch Logs
2. THE Voice_Streaming SHALL ghi logs vào CloudWatch Logs thông qua CloudWatch Agent trên EC2
3. THE Monitoring_System SHALL theo dõi các metrics: CPU, Memory, Request count, Response time cho ECS tasks và EC2 instance
4. THE Monitoring_System SHALL theo dõi custom metrics: số active sessions, latency per turn, AI API response time
5. WHEN EC2 CPU vượt quá 80% liên tục trong 5 phút, THE CloudWatch Alarm SHALL gửi thông báo qua SNS
6. WHEN AI_Service response time vượt quá 500ms, THE CloudWatch Alarm SHALL gửi thông báo qua SNS

### Yêu cầu 12: Hiệu năng và Chất lượng

**User Story:** Là một developer, tôi muốn hệ thống đáp ứng các tiêu chí hiệu năng và chất lượng cụ thể, để đảm bảo trải nghiệm người dùng tốt.

#### Tiêu chí chấp nhận

1. THE AI_Platform SHALL hỗ trợ tối thiểu 20 voice sessions đồng thời mà không phát sinh lỗi
2. THE Voice_Streaming SHALL đảm bảo latency từ lúc user ngừng nói đến khi nghe AI trả lời dưới 2.5 giây
3. THE Voice_Streaming SHALL đảm bảo audio output không có artifact và pacing đúng real-time
4. THE AI_Service SHALL xử lý mỗi request trong thời gian dưới 500ms (không tính thời gian AI provider xử lý)
5. THE Monorepo SHALL build thành công toàn bộ libs và apps, tất cả libs export đúng public APIs
6. THE ai-core adapters SHALL có unit tests pass cho tất cả 4 adapters (LLM, TTS, STT, Realtime)
