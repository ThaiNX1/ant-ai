# Voice Streaming — Robot Giáo Dục AI

## Tổng quan

Hệ thống voice streaming cho robot giáo dục thông minh, hỗ trợ trẻ 6-10 tuổi học tiếng Anh qua tương tác giọng nói và hình ảnh. Robot hoạt động ở 2 chế độ: nói chuyện tự do (Free Talk) và học theo giáo trình (Lesson Mode).

---

## 1. Kiến trúc tổng quan

```
┌─────────────────┐     UDP:5004 (audio)     ┌──────────────────────────┐
│  Robot (Client)  │ ◄──────────────────────► │  voice-streaming (Python)│
│  - Mic + Speaker │                          │  trên EC2                │
│  - Màn hình LCD  │                          │  CHỈ xử lý:             │
│  - Touch screen  │                          │  - UDP/RTP packets       │
│  - Opus codec    │                          │  - Encode/decode Opus    │
│                  │                          │  - Detect silence/level  │
│                  │                          │  - Forward audio bytes   │
│                  │                          └──────────┬───────────────┘
│                  │                                     │ WebSocket (audio bytes)
│                  │                                     ▼
│                  │     MQTT (image/text/    ┌──────────────────────────┐
│                  │      command/answer)     │  lesson-service (NestJS) │
│                  │ ◄──────────────────────► │  trên Fargate            │
│                  │                          │  XỬ LÝ TẤT CẢ LOGIC:   │
│                  │     HTTP (lesson pack    │  - Lesson Orchestrator   │
│                  │      download, config)   │  - Step Completion Engine│
└─────────────────┘                          │  - Prompt Builder        │
                                             │  - Cached Feedback (3 tầng)│
                                             │  - MQTT publish/subscribe│
                                             │  - Session Manager       │
                                             │  - Free Talk Handler     │
                                             │  - DB (progress, attempts)│
                                             │  - Redis cache           │
                                             └──────────┬───────────────┘
                                                        │ import AiCoreModule
                                                        │ (in-process)
                                                        ▼
                                             ┌──────────────────────────┐
                                             │  ai-service (NestJS)     │
                                             │  - LLM (generate/stream) │
                                             │  - TTS (synthesize)      │
                                             │  - STT (transcribe)      │
                                             │  - Pronunciation Assess. │
                                             └──────────┬───────────────┘
                                                        │
                                                        ▼
                                             ┌──────────────────────────┐
                                             │  PostgreSQL (RDS)        │
                                             │  + Redis (ElastiCache)   │
                                             └──────────────────────────┘
```

### Phân chia trách nhiệm

| Component | Ngôn ngữ | Chạy trên | Trách nhiệm |
|-----------|----------|-----------|-------------|
| voice-streaming | Python | EC2 | CHỈ UDP/RTP audio: nhận/gửi packets, Opus encode/decode, detect silence, forward audio bytes qua WebSocket |
| lesson-service | NestJS | Fargate | TẤT CẢ logic: Orchestrator, LLM, MQTT, DB, Cache, Session, Free Talk |
| ai-service | NestJS | Fargate | AI adapters: LLM, TTS, STT, Pronunciation |

### Giao thức truyền thông

| Kênh | Giao thức | Từ → Đến | Mục đích |
|------|-----------|----------|----------|
| Audio | UDP/RTP (port 5004) | Robot ↔ Python | Voice in/out realtime, Opus codec |
| Audio bridge | WebSocket | Python ↔ NestJS lesson-service | Forward audio bytes |
| Visual + Control | MQTT | NestJS ↔ Robot | Ảnh, text, quiz, commands |
| AI calls | HTTP (in-process) | lesson-service → ai-service | LLM, TTS, STT, Pronunciation |
| Data nặng | HTTP | Robot → Backend | Download lesson pack, sync profile |

### Giao tiếp Python ↔ NestJS (WebSocket)

```
Python → NestJS:
  {type: "audio", robot_id: "xxx", data: <binary audio bytes>}
  {type: "silence_detected", robot_id: "xxx", duration_ms: 2000}
  {type: "audio_level", robot_id: "xxx", level: 0.3}
  {type: "robot_connected", robot_id: "xxx"}
  {type: "robot_disconnected", robot_id: "xxx"}

NestJS → Python:
  {type: "play_audio", robot_id: "xxx", data: <binary TTS audio>}
  {type: "stop_audio", robot_id: "xxx"}
```


---

## 2. Hai chế độ hoạt động

### 2.1. Free Talk — Nói chuyện tự do

Trẻ nói chuyện tự do với AI, không theo giáo trình.

```
Robot nói → RTP audio → STT (chuyển thành text)
  → LLM generate (system prompt = character persona)
  → TTS (chuyển text → audio)
  → RTP audio → Robot phát loa
```

System prompt:
```
Bạn là trợ lý thông minh trên robot giáo dục.
Nói chuyện thân thiện, dễ hiểu, phù hợp trẻ em.
Trả lời ngắn gọn (dưới 3 câu) vì đây là hội thoại giọng nói.
```

Conversation history được lưu trong DB và load lại khi trẻ quay lại, giúp AI nhớ context trước đó.

### 2.2. Lesson Mode — Học theo giáo trình

AI bị ràng buộc bởi lesson plan. Orchestrator điều khiển từng step, LLM chỉ làm 1 việc nhỏ mỗi lần gọi.

```
Orchestrator giữ toàn bộ lesson trong RAM
  → Mỗi step, build 1 prompt ngắn, rõ ràng
  → LLM chỉ làm 1 việc: giảng / đánh giá / feedback
  → Orchestrator quyết định chuyển step, không phải LLM
```

**Nguyên tắc cốt lõi:** AI không "biết" toàn bộ giáo trình. Mỗi lần gọi LLM chỉ đưa đúng 1 step + context cần thiết. Orchestrator là "não", LLM chỉ là "miệng".

### 2.3. Voice Pipeline thống nhất

Cả Free Talk và Lesson mode đều dùng cùng pipeline:

```
Audio → STT (Whisper) → LLM → TTS (ElevenLabs, custom voice) → Audio
```

Không dùng LLM Realtime API vì:
- Không hỗ trợ custom voice (chỉ có ~6 giọng cố định)
- Không pronunciation assessment
- Không cache được (output là audio, không phải text)
- Không kiểm soát nội dung trước khi phát

### 2.4. VoiceConfig — Cấu hình giọng nói

Mỗi robot/course có thể config giọng riêng, load 1 lần khi session bắt đầu, truyền vào mọi TTS call.

```typescript
interface VoiceConfig {
  voiceId: string;          // ElevenLabs voice ID (custom clone hoặc preset)
  stability: number;        // 0-1, giọng ổn định (cao = ít biến đổi)
  similarityBoost: number;  // 0-1, giống mẫu gốc (cao = giống hơn)
  style: number;            // 0-1, biểu cảm (cao = nhiều cảm xúc)
  speed: number;            // 0.5-2.0 (< 1 = chậm, phù hợp trẻ em)
  language: string;         // vi, en, vi-en (mix)
}
```

Ví dụ:

```typescript
// Giọng giáo viên robot — đã clone từ mẫu giọng thật
const robotTeacherVoice: VoiceConfig = {
  voiceId: 'custom_teacher_001',
  stability: 0.7,
  similarityBoost: 0.8,
  style: 0.5,
  speed: 0.9,              // chậm hơn chút cho trẻ em
  language: 'vi',
};

// Giọng giáo viên tiếng Anh — native speaker
const englishTeacherVoice: VoiceConfig = {
  voiceId: 'custom_english_teacher_002',
  stability: 0.8,
  similarityBoost: 0.9,
  style: 0.3,
  speed: 0.85,
  language: 'en',
};
```

VoiceConfig lưu ở DB:
- `robots.config` JSONB → voice mặc định của robot
- `courses.config` JSONB → voice riêng cho từng khóa học (override robot default)
- Ưu tiên: course voice > robot voice > system default

---

## 3. Cấu trúc giáo trình (Lesson Plan)

### 3.1. Database Schema

```
courses ──► lessons ──► lesson_steps
(khóa học)  (bài học)   (từng bước trong bài)
```

### 3.2. Các loại step

| Type | Mô tả | Input từ trẻ | AI làm gì |
|------|--------|--------------|-----------|
| `teach_with_image` | Giảng bài + hiện ảnh | Không | LLM generate lời giảng → TTS |
| `pronounce` | Luyện phát âm | Voice (audio) | Pronunciation Assessment → LLM feedback |
| `image_quiz` | Chọn ảnh đáp án | Touch hoặc Voice | LLM đánh giá đúng/sai |
| `voice_quiz` | Hiện ảnh, trẻ nói tên | Voice | Constrained STT + LLM judge |
| `summary` | Tổng kết bài | Không | LLM tổng kết |

### 3.3. Ví dụ lesson plan (English for Kids — Animals)

```json
{
  "id": "eng-grade1-animals",
  "title": "Animals - Lesson 1",
  "target_age": "6-8",
  "steps": [
    {
      "step_id": 1,
      "type": "teach_with_image",
      "image_url": "lessons/animals/elephant.jpg",
      "audio_text": "This is an elephant. Can you say elephant?",
      "word": "elephant",
      "phonetic": "/ˈɛl.ɪ.fənt/"
    },
    {
      "step_id": 2,
      "type": "pronounce",
      "image_url": "lessons/animals/elephant.jpg",
      "word": "elephant",
      "min_score": 50,
      "max_attempts": 3
    },
    {
      "step_id": 3,
      "type": "image_quiz",
      "question_audio": "Which one is the elephant?",
      "options": [
        {"id": "A", "image_url": "lessons/animals/cat.jpg", "label": "Cat"},
        {"id": "B", "image_url": "lessons/animals/elephant.jpg", "label": "Elephant"},
        {"id": "C", "image_url": "lessons/animals/dog.jpg", "label": "Dog"}
      ],
      "correct": "B",
      "accept_voice": true,
      "accept_touch": true
    },
    {
      "step_id": 4,
      "type": "voice_quiz",
      "image_url": "lessons/animals/cat.jpg",
      "question_audio": "What animal is this? Say it in English!",
      "correct_answer": "cat",
      "accept_similar": ["cat", "kat", "cát"],
      "min_pronunciation_score": 50
    },
    {
      "step_id": 5,
      "type": "summary",
      "content": "Hôm nay chúng ta đã học elephant, cat, dog. Giỏi lắm!"
    }
  ]
}
```


---

## 4. Xử lý phát âm trẻ em (6-10 tuổi)

### 4.1. Vấn đề

Trẻ phát âm chưa chuẩn → STT nhận sai text → đánh giá sai → trải nghiệm tệ.

```
Ví dụ:
  Bài học yêu cầu: "elephant"
  Trẻ nói:         "ewephant" (phát âm /l/ thành /w/)
  STT nhận được:   "a weapon" hoặc "ewa font"
  → So sánh text: SAI → trẻ bị đánh sai oan
```

### 4.2. Giải pháp: Pipeline 3 tầng

```
Audio từ trẻ
    │
    ├─── Tầng 1: Constrained STT (giới hạn vocabulary theo bài học)
    │         ↓
    ├─── Tầng 2: Pronunciation Assessment (so sánh audio vs phát âm chuẩn)
    │         ↓
    └─── Tầng 3: LLM Fuzzy Judge (phán quyết cuối cùng)
              ↓
         Feedback cho trẻ
```

**Tầng 1 — Constrained STT:** Thu hẹp vocabulary theo bài học, tăng accuracy từ ~40% lên ~85%.

```python
# Azure Speech SDK: phrase list
speech_config.add_phrase("elephant")
speech_config.add_phrase("ewephant")  # biến thể phổ biến

# OpenAI Whisper: prompt hint
whisper_prompt = "The student is trying to say: elephant, cat, dog, bird"
```

**Tầng 2 — Pronunciation Assessment:** So sánh trực tiếp audio với phát âm chuẩn, KHÔNG phụ thuộc STT.

```
Azure Pronunciation Assessment:
  Input:  audio waveform + reference_text="elephant"
  Output: overall_score: 72
          phonemes:
            /ɛ/ → 95 ✅
            /l/ → 35 ⚠️ (trẻ nói /w/)
            /f/ → 90 ✅
            /ə/ → 85 ✅
            /n/ → 92 ✅
            /t/ → 80 ✅
```

**Tầng 3 — LLM Fuzzy Judge:** Tổng hợp kết quả từ tầng 1+2, đưa feedback phù hợp trẻ em.

### 4.3. Ngưỡng đánh giá theo độ tuổi

```python
SCORING_THRESHOLDS = {
    "age_6_7": {
        "pass_score": 50,
        "excellent_score": 75,
        "max_attempts": 5,
        "forgive_phonemes": ["/θ/", "/ð/", "/r/", "/l/"],
    },
    "age_8_10": {
        "pass_score": 60,
        "excellent_score": 85,
        "max_attempts": 3,
        "forgive_phonemes": ["/θ/", "/ð/"],
    },
}
```

### 4.4. Xử lý các case đặc thù

| Case | Ví dụ | Xử lý |
|------|-------|-------|
| Mix Việt-Anh | "con cát" thay vì "cat" | LLM nhận ra có "cat", pass nhẹ, nhắc nói tiếng Anh |
| Nói quá nhỏ | Audio level thấp | Detect trước STT → "Nói to hơn chút nhé!" |
| Phát âm sai nặng | "free" thay vì "three" | Pronunciation score thấp → hướng dẫn cụ thể âm /θ/ |
| Im lặng / tiếng ồn | Silence hoặc noise | Audio energy < threshold → "Mình chờ bạn nè!" |
| Nói đúng nội dung, sai phát âm | Nói "elephant" nhưng /l/ yếu | Pass nội dung + gợi ý cải thiện phát âm |

### 4.5. API đánh giá phát âm khuyến nghị

| API | Ưu điểm | Nhược điểm | Chi phí |
|-----|---------|------------|---------|
| **Azure Speech SDK** (khuyến nghị) | Phoneme-level detail, accuracy/fluency/completeness score | Cần Azure account | ~$1/1000 calls |
| Google Cloud Speech | Word confidence + timing | Không chi tiết phoneme | ~$0.6/1000 calls |
| SpeechAce | Chuyên pronunciation, IELTS scoring | API riêng, ít tài liệu | Custom pricing |
| OpenAI Whisper | Word timestamps + log_prob | Không chuyên pronunciation | ~$0.6/1000 calls |


---

## 5. MQTT Topic Design — Đồng bộ Audio + Visual

### 5.1. Topic structure

```
# Server → Robot
robot/{robot_id}/lesson/image        ← Hiện ảnh trên màn hình
robot/{robot_id}/lesson/text         ← Hiện text trên màn hình
robot/{robot_id}/lesson/command      ← Lệnh: next_step, pause, resume, end
robot/{robot_id}/lesson/options      ← Hiện quiz options (ảnh + label)

# Robot → Server
robot/{robot_id}/student/answer      → Trẻ chọn đáp án (tap màn hình)
robot/{robot_id}/student/event       → Events: ready, image_loaded, timeout
robot/{robot_id}/student/status      → Battery, wifi, mic status
```

### 5.2. Truyền ảnh qua MQTT

MQTT payload chứa URL/path, không chứa binary ảnh:

```
Option 1 (khuyến nghị): Ảnh cache sẵn trên robot
  Robot download lesson pack trước khi bắt đầu bài
  MQTT chỉ gửi: {"type": "show_image", "local_path": "lessons/animals/elephant.jpg"}

Option 2: URL từ CDN/S3
  {"type": "show_image", "url": "https://cdn.example.com/lessons/animals/elephant.jpg"}

Option 3: Base64 (chỉ cho ảnh nhỏ < 100KB)
  {"type": "show_image", "base64": "data:image/jpeg;base64,..."}
```

### 5.3. Đồng bộ timing giữa UDP và MQTT

```python
async def execute_teach_step(self, step):
    """Đồng bộ: gửi ảnh trước, chờ load xong, rồi phát audio."""
    # 1. Gửi ảnh qua MQTT
    await self.mqtt.publish(
        f"robot/{self.robot_id}/lesson/image",
        {"url": step["image_url"]}
    )
    # 2. Chờ robot confirm đã hiện ảnh (timeout 3s)
    await self.wait_for_event("image_loaded", timeout=3.0)
    # 3. Phát audio giảng bài qua UDP
    await self.audio.speak(step["audio_text"])
```

### 5.4. Quiz — Nhận đáp án từ 2 kênh

```python
async def wait_for_answer(self, accept_voice, accept_touch, timeout=15.0):
    """Chờ đáp án từ MQTT (touch) hoặc UDP (voice), ai đến trước thắng."""
    tasks = []
    if accept_touch:
        tasks.append(self.wait_mqtt_answer())   # trẻ tap màn hình
    if accept_voice:
        tasks.append(self.wait_voice_answer())  # trẻ nói

    done, pending = await asyncio.wait(
        tasks, timeout=timeout, return_when=asyncio.FIRST_COMPLETED
    )
    for task in pending:
        task.cancel()

    return done.pop().result() if done else None  # None = timeout
```

---

## 6. Lưu trữ dữ liệu

### 6.1. Database Schema

```sql
-- GIÁO TRÌNH
courses              → Khóa học (English Level 1, Math Grade 3...)
lessons              → Bài học trong khóa (Animals Lesson 1, Colors Lesson 2...)
lesson_steps         → Từng bước trong bài (teach, pronounce, quiz...)
                       config lưu dạng JSONB (linh hoạt, không cần thêm cột)

-- HỌC SINH
students             → Profile trẻ (tên, tuổi, robot_id, preferences)
enrollments          → Đăng ký khóa học (student + course)

-- TIẾN ĐỘ + LOG
lesson_progress      → Tiến độ từng bài (current_step, status, session_data)
step_attempts        → Log từng lần thử (STT text, pronunciation score, feedback)
conversation_history → Lịch sử trò chuyện (cả free_talk và lesson mode)
```

### 6.2. lesson_progress — Key cho resume bài dở

```sql
CREATE TABLE lesson_progress (
    id              UUID PRIMARY KEY,
    student_id      UUID REFERENCES students(id),
    lesson_id       UUID REFERENCES lessons(id),
    status          VARCHAR(20),    -- not_started, in_progress, paused, completed
    current_step    INT DEFAULT 0,  -- step đang làm dở
    total_steps     INT,
    score           FLOAT,
    started_at      TIMESTAMP,
    paused_at       TIMESTAMP,
    completed_at    TIMESTAMP,
    session_data    JSONB,          -- state snapshot để resume
    updated_at      TIMESTAMP
);
```

### 6.3. session_data JSONB — Snapshot để resume

```json
{
  "current_step": 4,
  "step_state": {
    "attempt_count": 1,
    "hints_given": [0],
    "last_answer": "dog"
  },
  "scores_so_far": {
    "step_1": {"score": 85, "attempts": 1},
    "step_2": {"score": 72, "attempts": 2},
    "step_3": {"score": 100, "attempts": 1}
  },
  "conversation_context": [
    {"role": "ai", "content": "What animal is this?"},
    {"role": "student", "content": "dog"},
    {"role": "ai", "content": "Not quite! Look again..."}
  ],
  "paused_reason": "disconnect",
  "paused_at": "2026-04-08T10:30:00Z"
}
```


---

## 7. Resume bài học dở

### 7.1. Flow khi robot kết nối

```
Robot kết nối → Server query lesson_progress
    │
    ├── Không có record status='in_progress'/'paused'
    │   → Bắt đầu bài mới (bài tiếp theo trong course)
    │
    └── Có record: lesson "Animals", current_step=4, paused 2h trước
        → Resume strategy tùy thời gian pause:
        │
        ├── < 24 giờ:   Resume trực tiếp từ step 4
        │                "Tiếp tục bài Animals nhé!"
        │
        ├── 1-7 ngày:   Ôn lại nhanh step 3-4, rồi tiếp step 5
        │                "Ôn lại chút rồi học tiếp nhé!"
        │
        └── > 7 ngày:   Học lại từ đầu nhưng fast-forward
                         (skip teach steps, chỉ quiz)
                         "Lâu rồi! Ôn lại bài Animals nha!"
```

### 7.2. Ví dụ cụ thể: Bài 12 steps, trẻ học được 4 steps rồi disconnect

```
Phiên trước:
  Step 1: teach "elephant"     ✅ completed
  Step 2: pronounce "elephant" ✅ score 72
  Step 3: teach "cat"          ✅ completed
  Step 4: voice_quiz "cat"     ⏸️ đang làm, attempt 1/3, trả lời "dog"
  Step 5-12: chưa làm

  → lesson_progress: status='paused', current_step=4
  → session_data: lưu attempt_count=1, last_answer="dog"

Phiên mới (trẻ quay lại sau 2 giờ):
  1. Load lesson_progress → current_step=4
  2. Load session_data → biết step 4 đang dở, attempt=1
  3. Robot: "Chào bạn! Lần trước mình đang hỏi về con mèo, tiếp tục nhé!"
  4. Hiện lại ảnh cat → hỏi lại "What animal is this?"
  5. Trẻ trả lời → tiếp tục bình thường từ step 4
```

---

## 8. Cách load bài học cho AI (Prompt Strategy)

### 8.1. Nguyên tắc

```
KHÔNG:  Đưa toàn bộ 12 steps vào system prompt → LLM tự dạy
        (LLM sẽ hallucinate, bỏ step, dạy sai)

ĐÚNG:  Orchestrator điều khiển từng step
        → Mỗi lần gọi LLM chỉ đưa 1 step + context cần thiết
        → LLM làm 1 việc nhỏ, rõ ràng
```

### 8.2. Prompt cho từng loại step

**Teach step — AI giảng bài:**
```
Bạn là giáo viên tiếng Anh trên robot cho trẻ 7 tuổi.
Bài học: Animals - Lesson 1
Tên học sinh: Minh

NHIỆM VỤ: Giảng nội dung sau cho trẻ, dùng giọng thân thiện.
NỘI DUNG: This is an elephant. Can you say elephant?
TỪ VỰNG: elephant (/ˈɛl.ɪ.fənt/)

Diễn đạt lại cho phù hợp trẻ 7 tuổi. Giữ từ tiếng Anh, giải thích bằng tiếng Việt.
```

**Pronounce step — Feedback phát âm:**
```
NHIỆM VỤ: Đưa feedback phát âm cho trẻ.
TỪ CẦN ĐỌC: elephant
ĐIỂM: 72/100
CHI TIẾT:
  - /ɛ/: 95 ✅
  - /l/: 35 ⚠️ (trẻ nói /w/)
  - /f/: 90 ✅
LẦN THỬ: 1/3
NGƯỠNG ĐẠT: 50

Nếu đạt: khen + chuyển tiếp.
Nếu chưa đạt: động viên + hướng dẫn cụ thể âm yếu nhất.
```

**Quiz step — Đánh giá câu trả lời:**
```
NHIỆM VỤ: Đánh giá câu trả lời của trẻ.
CÂU HỎI: What animal is this?
ĐÁP ÁN ĐÚNG: cat
TRẺ TRẢ LỜI: 'kat' (qua voice)

Trả lời JSON: {"correct": true/false, "feedback": "..."}
Lưu ý: trẻ 7 tuổi, 'cat' và 'kat' và 'cát' đều tính đúng.
```

**Resume greeting — Chào khi quay lại:**
```
NHIỆM VỤ: Chào học sinh quay lại học tiếp.
BÀI ĐANG HỌC: Animals - Lesson 1
ĐÃ HỌC ĐƯỢC: step 4/12
CÁC TỪ ĐÃ HỌC: elephant, cat
THỜI GIAN NGHỈ: 2 giờ

Chào ngắn gọn, nhắc lại từ đã học, rồi nói tiếp tục.
```

### 8.3. System prompt khóa AI trong phạm vi bài học

```
Bạn là giáo viên robot đang dạy bài "Animals - Lesson 1".
Bạn PHẢI tuân theo giáo trình. KHÔNG được dạy nội dung ngoài bài học.

QUY TẮC:
1. Nếu trẻ hỏi ngoài bài → "Câu hỏi hay, nhưng giờ mình quay lại bài nhé"
2. Nếu trẻ trả lời đúng → khen + chuyển bước tiếp
3. Nếu trẻ trả lời sai → cho gợi ý, tối đa 3 lần
4. Giọng thân thiện, dễ hiểu, phù hợp trẻ em
5. Trả lời ngắn (1-2 câu) vì đây là hội thoại giọng nói
6. KHÔNG BAO GIỜ nói "sai" — dùng "gần đúng rồi", "thử lại nhé"
```


---

## 9. Flow chi tiết từng loại step

### 9.1. teach_with_image

```
Orchestrator                    MQTT                    UDP                     AI
    │                            │                       │                      │
    ├── publish image ──────────►│                       │                      │
    │                            ├── robot hiện ảnh      │                      │
    │◄── event: image_loaded ────┤                       │                      │
    │                            │                       │                      │
    ├── build teach prompt ──────┼───────────────────────┼─────────────────────►│
    │◄── speech text ────────────┼───────────────────────┼──────────────────────┤
    │                            │                       │                      │
    ├── TTS ─────────────────────┼───────────────────────┼─────────────────────►│
    │◄── audio chunks ───────────┼───────────────────────┼──────────────────────┤
    │                            │                       │                      │
    ├── stream audio ────────────┼──────────────────────►│                      │
    │                            │                       ├── robot phát loa     │
    │                            │                       │                      │
    ├── advance_step()           │                       │                      │
```

### 9.2. pronounce

```
Orchestrator                    MQTT                    UDP                     AI
    │                            │                       │                      │
    ├── publish image ──────────►│                       │                      │
    ├── TTS "Hãy nói elephant"─-─┼──────────────────────►│                      │
    │                            │                       │                      │
    │                            │    ◄── trẻ nói ───────┤                      │
    │◄── audio chunk ────────────┼───────────────────────┤                      │
    │                            │                       │                      │
    ├── Pronunciation Assess ────┼───────────────────────┼─────────────────────►│
    │◄── score + phonemes ───────┼───────────────────────┼──────────────────────┤
    │                            │                       │                      │
    ├── build feedback prompt ───┼───────────────────────┼─────────────────────►│
    │◄── feedback text ──────────┼───────────────────────┼──────────────────────┤
    │                            │                       │                      │
    ├── TTS feedback ────────────┼──────────────────────►│                      │
    │                            │                       │                      │
    ├── score >= min_score?      │                       │                      │
    │   ├── YES: advance_step()  │                       │                      │
    │   └── NO:  attempt < max?  │                       │                      │
    │       ├── YES: chờ thử lại │                       │                      │
    │       └── NO:  advance()   │                       │                      │
```

### 9.3. image_quiz

```
Orchestrator                    MQTT                    UDP                     AI
    │                            │                       │                      │
    ├── publish quiz options ───►│                       │                      │
    │                            ├── robot hiện 3 ảnh    │                      │
    ├── TTS câu hỏi ─────────-───┼──────────────────────►│                      │
    │                            │                       │                      │
    │   Chờ đáp án (race):       │                       │                      │
    │   ┌── MQTT: trẻ tap ảnh  ──┤                       │                      │
    │   └── UDP: trẻ nói  ───────┼───────────────────────┤                      │
    │                            │                       │                      │
    │◄── answer (touch hoặc voice)                       │                      │
    │                            │                       │                      │
    ├── build judge prompt ──────┼───────────────────────┼─────────────────────►│
    │◄── {"correct": true} ──────┼───────────────────────┼──────────────────────┤
    │                            │                       │                      │
    ├── TTS feedback ────────────┼──────────────────────►│                      │
    ├── advance_step()           │                       │                      │
```

### 9.4. voice_quiz

```
Orchestrator                    MQTT                    UDP                     AI
    │                            │                       │                      │
    ├── publish image ──────────►│                       │                      │
    ├── TTS "What is this?"  ────┼──────────────────────►│                      │
    │                            │                       │                      │
    │                            │    ◄── trẻ nói ───────┤                      │
    │◄── audio chunk ────────────┼───────────────────────┤                      │
    │                            │                       │                      │
    │   Chạy SONG SONG:          │                       │                      │
    ├── Constrained STT ─────────┼───────────────────────┼─────────────────────►│
    ├── Pronunciation Assess ────┼───────────────────────┼─────────────────────►│
    │◄── stt_text + pron_score ──┼───────────────────────┼──────────────────────┤
    │                            │                       │                      │
    ├── build judge prompt ──────┼───────────────────────┼─────────────────────►│
    │◄── feedback ───────────────┼───────────────────────┼──────────────────────┤
    │                            │                       │                      │
    ├── TTS feedback ────────────┼──────────────────────►│                      │
```


---

## 10. Scale — 5000 sessions đồng thời

### 10.1. Ước tính tài nguyên

| Tài nguyên | 1 session | 5000 sessions | Ghi chú |
|------------|-----------|---------------|---------|
| RAM (Orchestrator) | ~36KB | ~180MB | Không phải vấn đề |
| CPU (audio decode) | - | 5-10 cores | 1 core ≈ 500-1000 streams |
| LLM API calls | 1 call/10s | 500 req/s | Bottleneck chính |
| Pronunciation API | ~10 calls/bài | 50K calls/giờ | ~$50/giờ (Azure) |
| DB connections | 1 | 5000 | Connection pool 50-100 |

### 10.2. Bottleneck và giải pháp

**LLM API — bottleneck lớn nhất → giải quyết bằng Pre-Cache khi load bài giảng:**

Ý tưởng cốt lõi: khi load bài giảng, pre-generate tất cả feedback có thể xảy ra → lưu Redis → tất cả trẻ dùng chung, không gọi LLM realtime.

```
TRƯỚC (không cache):
  Trẻ A nói "elephant" score 65 → gọi LLM → feedback → 200-600ms
  Trẻ B nói "elephant" score 68 → gọi LLM → feedback → 200-600ms
  Trẻ C nói "elephant" score 62 → gọi LLM → feedback → 200-600ms
  → 3 LLM calls cho feedback gần giống nhau

SAU (pre-cache khi load bài):
  Load lesson "Animals" → pre-generate feedback cho mỗi từ × mỗi bucket
  → Lưu Redis
  → Trẻ A, B, C đều hit cache → 1-5ms, KHÔNG gọi LLM
```

**Cache key structure:**

```
Pronunciation feedback:
  pron:{word}:{score_bucket}:{weak_phoneme}
  Ví dụ: pron:elephant:good:/l/
         pron:elephant:medium:general
         pron:cat:excellent:general

Quiz feedback:
  quiz:{correct_answer}:correct
  quiz:{correct_answer}:wrong
  Ví dụ: quiz:elephant:correct
         quiz:cat:wrong
```

**Score buckets:**

```
excellent:  80-100  → "Xuất sắc! Phát âm rất chuẩn!"
good:       60-79   → "Tốt lắm! Chú ý thêm âm X"
medium:     40-59   → "Gần đúng rồi! Thử lại nhé"
low:        0-39    → "Cố lên! Nghe mình nói lại nha"
```

**Pre-generate khi load lesson:**

```python
class LessonCacheWarmer:
    """Pre-generate feedback khi load bài giảng. Chạy 1 lần, dùng chung cho tất cả trẻ."""

    SCORE_BUCKETS = {
        "excellent": (80, 100),
        "good":      (60, 79),
        "medium":    (40, 59),
        "low":       (0, 39),
    }

    # Phonemes trẻ Việt Nam thường phát âm sai
    COMMON_WEAK_PHONEMES = ["/θ/", "/ð/", "/r/", "/l/", "/ʃ/", "/ʒ/", "/z/"]

    async def warm_lesson_cache(self, lesson):
        """Gọi 1 lần khi load lesson. Pre-generate tất cả feedback."""
        for step in lesson["steps"]:
            if step["type"] in ("pronounce", "voice_quiz"):
                await self._warm_pronunciation_feedback(step)
            if step["type"] in ("image_quiz", "voice_quiz"):
                await self._warm_quiz_feedback(step)

    async def _warm_pronunciation_feedback(self, step):
        word = step.get("word") or step.get("correct_answer")

        for bucket_name, (min_s, max_s) in self.SCORE_BUCKETS.items():
            # Feedback chung (không có phoneme cụ thể)
            cache_key = f"pron:{word}:{bucket_name}:general"
            if not await self.cache.exists(cache_key):
                feedback = await self._generate_pron_feedback(
                    word, bucket_name, min_s, max_s, weak_phoneme=None
                )
                await self.cache.set(cache_key, feedback, ttl=86400)  # 24h

            # Feedback cho từng phoneme yếu phổ biến
            for phoneme in self.COMMON_WEAK_PHONEMES:
                cache_key = f"pron:{word}:{bucket_name}:{phoneme}"
                if not await self.cache.exists(cache_key):
                    feedback = await self._generate_pron_feedback(
                        word, bucket_name, min_s, max_s, weak_phoneme=phoneme
                    )
                    await self.cache.set(cache_key, feedback, ttl=86400)

    async def _warm_quiz_feedback(self, step):
        correct = step.get("correct") or step.get("correct_answer")

        for result in ("correct", "wrong"):
            cache_key = f"quiz:{correct}:{result}"
            if not await self.cache.exists(cache_key):
                prompt = (
                    f"Trẻ 6-10 tuổi trả lời {'đúng' if result == 'correct' else 'sai'}, "
                    f"đáp án đúng là '{correct}'. "
                    f"{'Khen' if result == 'correct' else 'Động viên'} ngắn gọn 1 câu."
                )
                feedback = await self.llm.generate_response(prompt)
                await self.cache.set(cache_key, feedback, ttl=86400)
```

**Lookup cache khi trẻ phát âm:**

```python
class CachedFeedbackService:
    """Lookup feedback từ cache, fallback gọi LLM nếu miss."""

    async def get_pronunciation_feedback(self, word, score, phoneme_detail):
        bucket = self._score_to_bucket(score)
        weak_phoneme = self._find_weakest_phoneme(phoneme_detail)
        cache_key = f"pron:{word}:{bucket}:{weak_phoneme or 'general'}"

        # Tầng 1: Redis (1-5ms)
        cached = await self.cache.get(cache_key)
        if cached:
            await self._track_hit(cache_key)
            return cached

        # Tầng 2: DB persistent (5-20ms) — dữ liệu đã học trước đó
        db_cached = await self.db.fetch_one(
            "SELECT feedback_text FROM feedback_cache WHERE cache_key = $1",
            cache_key
        )
        if db_cached:
            feedback = db_cached["feedback_text"]
            # Đẩy lại lên Redis để lần sau hit tầng 1
            await self.cache.set(cache_key, feedback, ttl=86400)
            await self._track_hit(cache_key)
            return feedback

        # Tầng 3: LLM generate (200-600ms) → write-back cả Redis + DB
        feedback = await self._generate_and_persist(
            cache_key, "pronunciation", word, bucket, weak_phoneme, score
        )
        return feedback

    async def get_quiz_feedback(self, correct_answer, is_correct):
        result_key = "correct" if is_correct else "wrong"
        cache_key = f"quiz:{correct_answer}:{result_key}"

        # Tầng 1: Redis
        cached = await self.cache.get(cache_key)
        if cached:
            await self._track_hit(cache_key)
            return cached

        # Tầng 2: DB persistent
        db_cached = await self.db.fetch_one(
            "SELECT feedback_text FROM feedback_cache WHERE cache_key = $1",
            cache_key
        )
        if db_cached:
            feedback = db_cached["feedback_text"]
            await self.cache.set(cache_key, feedback, ttl=86400)
            await self._track_hit(cache_key)
            return feedback

        # Tầng 3: LLM → write-back Redis + DB
        prompt = (
            f"Trẻ 6-10 tuổi trả lời {'đúng' if is_correct else 'sai'}, "
            f"đáp án đúng là '{correct_answer}'. "
            f"{'Khen' if is_correct else 'Động viên'} ngắn gọn 1 câu."
        )
        feedback = await self.llm.generate_response(prompt)
        await self._persist(cache_key, "quiz", correct_answer, None, None, feedback)
        return feedback

    async def _generate_and_persist(self, cache_key, cache_type, word, bucket, weak_phoneme, score):
        """Gọi LLM + lưu vào cả Redis và DB (persistent)."""
        phoneme_hint = f"Âm yếu nhất: {weak_phoneme}." if weak_phoneme else ""
        prompt = (
            f"Trẻ 6-10 tuổi đọc từ '{word}', điểm phát âm ~{score}/100.\n"
            f"{phoneme_hint}\n"
            f"Feedback 1-2 câu, vui vẻ, phù hợp trẻ em."
        )
        feedback = await self.llm.generate_response(prompt)
        await self._persist(cache_key, cache_type, word, bucket, weak_phoneme, feedback)
        return feedback

    async def _persist(self, cache_key, cache_type, word, bucket, weak_phoneme, feedback):
        """Write-back vào cả Redis (fast) và DB (persistent)."""
        # Redis — cho tốc độ
        await self.cache.set(cache_key, feedback, ttl=86400)

        # DB — persistent, sống sót qua Redis restart/eviction
        await self.db.execute(
            """INSERT INTO feedback_cache
               (id, cache_key, cache_type, word, score_bucket, weak_phoneme,
                feedback_text, source, hit_count)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'llm', 0)
               ON CONFLICT (cache_key) DO UPDATE SET
                 feedback_text = EXCLUDED.feedback_text,
                 updated_at = NOW()""",
            cache_key, cache_type, word, bucket, weak_phoneme, feedback
        )

    async def _track_hit(self, cache_key):
        """Track số lần sử dụng (async, không block response)."""
        asyncio.create_task(self.db.execute(
            """UPDATE feedback_cache
               SET hit_count = hit_count + 1, last_hit_at = NOW()
               WHERE cache_key = $1""",
            cache_key
        ))

    def _score_to_bucket(self, score):
        if score >= 80: return "excellent"
        if score >= 60: return "good"
        if score >= 40: return "medium"
        return "low"

    def _find_weakest_phoneme(self, detail):
        if not detail or not detail.get("phonemes"):
            return None
        weakest = min(detail["phonemes"], key=lambda p: p["score"])
        return weakest["phoneme"] if weakest["score"] < 70 else None
```

**Số lượng cache entries:**

```
1 bài học = ~10 từ vựng
Mỗi từ: 4 buckets × (1 general + 7 phonemes) = 32 entries
10 từ × 32 = 320 pronunciation entries
+ quiz feedback: ~20 entries
= ~340 entries/bài × ~100 bytes = ~34KB/bài

50 bài học active = ~17,000 entries = ~1.7MB Redis
→ Gần như không tốn tài nguyên
```

**Khi nào vẫn cần gọi LLM realtime?**

| Case | Lý do | Tần suất |
|------|-------|----------|
| Cache miss (cả Redis + DB) | Phoneme/word chưa từng gặp | Lần đầu tiên, sau đó 0% |
| Free talk mode | Không có giáo trình, nội dung tự do | 100% |
| Resume greeting | Cá nhân hóa theo tên + progress | 1 lần/phiên |
| Trẻ hỏi ngoài bài | "Tại sao voi có vòi?" | Tùy trẻ |
| Teach step (giảng bài) | Cần diễn đạt tự nhiên | 1 lần/step |

**Cache 3 tầng — flow lookup:**

```
Tầng 1: Redis (1-5ms)
  ├── HIT  → trả về ngay, track hit_count async
  └── MISS ↓

Tầng 2: DB feedback_cache (5-20ms)
  ├── HIT  → trả về + đẩy lại lên Redis (warm lại)
  └── MISS ↓

Tầng 3: LLM generate (200-600ms)
  └── Trả về + write-back vào CẢ Redis + DB
      → Lần sau: Redis hit
      → Redis restart/eviction: DB hit
      → Không bao giờ gọi LLM lại cho cùng key
```

**Dữ liệu tích lũy theo thời gian:**

```
Ngày 1:   Pre-warm 340 entries/bài → Redis + DB
Tuần 1:   Trẻ học → cache miss tạo thêm ~50 entries mới (phoneme lạ)
Tháng 1:  ~500 entries/bài, hit rate ~99%
Tháng 6:  Gần như 100% hit, LLM chỉ gọi cho free_talk + teach steps
```

**hit_count tracking:** Biết feedback nào được dùng nhiều nhất, dùng để:
- Ưu tiên giữ trong Redis khi memory pressure
- Phân tích phoneme nào trẻ hay sai nhất
- Cải thiện chất lượng feedback (re-generate entries có hit_count cao)

**Kết quả: giảm ~80-90% LLM calls trong lesson mode. Sau tháng đầu tiên, gần 100%.**

**Audio processing — CPU intensive:**

```
Giải pháp: Horizontal scale EC2

  < 500 sessions:   1 EC2 c6i.xlarge (4 cores, 8GB)
  500-2000:          2 EC2 c6i.2xlarge + cache
  2000-5000:         3 EC2 c6i.2xlarge + cache + LLM queue
  > 5000:            Thêm EC2 nodes
```

### 10.3. Kiến trúc scale

```
                         ┌──────────────┐
                         │   Load       │
                         │   Balancer   │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │ voice-stream-1 │ │ voice-stream-2 │ │ voice-stream-3 │
     │ ~1700 sessions │ │ ~1700 sessions │ │ ~1600 sessions │
     │ EC2 c6i.2xl    │ │ EC2 c6i.2xl    │ │ EC2 c6i.2xl    │
     └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
             │                  │                   │
             └──────────────────┼───────────────────┘
                                ▼
              ┌─────────────────────────────────────┐
              │         ai-service (Fargate)         │
              │         Auto-scale 4-20 tasks        │
              │         + Redis cache                │
              │         + LLM request queue          │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │         PostgreSQL (RDS)             │
              │         + Read replica               │
              └─────────────────────────────────────┘
```

### 10.4. Session cleanup

```python
# Tự động dọn session idle > 5 phút
# Lưu progress vào DB trước khi xóa khỏi RAM
async def cleanup_idle(self, max_idle_seconds=300):
    now = time.time()
    for robot_id, last_active in self.last_activity.items():
        if now - last_active > max_idle_seconds:
            await self.save_and_pause(self.sessions[robot_id])
            del self.sessions[robot_id]
```

### 10.5. Ước tính chi phí (5000 concurrent)

| Resource | Chi phí/tháng |
|----------|--------------|
| 3× EC2 c6i.2xlarge (voice-streaming) | ~$750 |
| ECS Fargate (ai-service, auto-scale) | ~$200 |
| Redis (cache) | ~$50 |
| RDS PostgreSQL | ~$100 |
| MQTT Broker (EMQX) | ~$50 |
| LLM API (với cache, ~$5-15/giờ peak) | ~$500-1500 |
| Pronunciation API (Azure) | ~$500 |
| ALB + NAT + network | ~$100 |
| **Tổng** | **~$2,250-3,250/tháng** |


---

## 11. Use Cases tổng hợp

### 11.1. Giáo dục (use case chính)

| Use case | Mô tả | Components sử dụng |
|----------|--------|---------------------|
| Học tiếng Anh cho trẻ | Giáo trình có ảnh, phát âm, quiz | LLM + TTS + STT + Pronunciation + MQTT |
| Học Toán | Giảng bài + hỏi đáp bằng giọng nói | LLM + TTS + STT |
| Đọc truyện tương tác | AI đọc truyện, trẻ chọn hướng đi | LLM + TTS + MQTT (ảnh minh họa) |
| Luyện phát âm | Chuyên sâu pronunciation drill | Pronunciation Assessment + TTS |
| Ôn tập thông minh | AI chọn bài ôn dựa trên điểm yếu | LLM + DB (step_attempts analysis) |

### 11.2. Chăm sóc khách hàng (customer-service app)

| Use case | Mô tả | Components sử dụng |
|----------|--------|---------------------|
| Chatbot CSKH | Trả lời tự động qua text | LLM + Knowledge Base (RAG) |
| Voicebot CSKH | Gọi điện / nhận cuộc gọi | LLM + TTS + STT + voice-streaming |
| Phân loại ticket | Tự động phân loại và route ticket | LLM + Ticket service |
| Training CSKH | Nhân viên luyện tập với AI đóng vai khách | LLM + Characters + TTS |

### 11.3. Doanh nghiệp nội bộ

| Use case | Mô tả | Components sử dụng |
|----------|--------|---------------------|
| Trợ lý AI nhân viên | Tra cứu quy trình, SOP | LLM + Knowledge Base |
| Tóm tắt cuộc họp | Audio → text → tóm tắt | STT + LLM |
| Web scraping | Thu thập dữ liệu đối thủ | Firecrawl + Brave Search |
| Content generation | Tạo bài viết, email, mô tả SP | LLM |

### 11.4. Sales & Marketing

| Use case | Mô tả | Components sử dụng |
|----------|--------|---------------------|
| Chatbot tư vấn SP | Tư vấn trên website | LLM + Knowledge Base |
| Outbound voice call | Xác nhận đơn, nhắc lịch | LLM + TTS + STT + voice-streaming |
| Lead qualification | Bot hỏi sơ bộ, phân loại | LLM + Ticket service |

---

## 12. Tech Stack tổng hợp

| Thành phần | Công nghệ | Vai trò |
|------------|-----------|---------|
| Monorepo | Nx | Quản lý polyglot (Python + NestJS) |
| Backend framework | NestJS 10+ (Fastify) | ai-service, lesson-service, customer-service |
| Voice streaming | Python (asyncio) | CHỈ UDP/RTP, Opus encode/decode |
| Lesson orchestrator | NestJS (TypeScript) | Orchestrator, step engine, prompt builder |
| LLM | Gemini Flash, Cerebras, Cohere, DeepSeek | Text generation |
| TTS | ElevenLabs, Sarvam | Text → Speech |
| STT | OpenAI Whisper | Speech → Text |
| Pronunciation | Azure Speech SDK | Đánh giá phát âm |
| Message broker | MQTT (Mosquitto/EMQX) | Robot ↔ lesson-service (image, text, commands) |
| Audio bridge | WebSocket | Python voice-streaming ↔ NestJS lesson-service |
| Database | PostgreSQL (TypeORM) | Giáo trình, tiến độ, logs, feedback cache |
| Cache | Redis | LLM response cache, session cache |
| Web scraping | Firecrawl, Brave Search | Thu thập dữ liệu |
| Deployment | AWS (EC2 + ECS Fargate + RDS + ElastiCache) | Production |
| CI/CD | GitHub Actions + Nx affected | Build/deploy chỉ app bị ảnh hưởng |

### Cấu trúc apps mới

```
apps/
├── voice-streaming/          ← Python: CHỈ UDP/RTP audio bridge
│   ├── audio_bridge.py       ← Nhận UDP, forward WS sang lesson-service
│   ├── opus_handler.py       ← Encode/decode Opus
│   ├── silence_detector.py   ← Detect silence, audio level
│   └── main.py
│
├── lesson-service/           ← NestJS: TẤT CẢ lesson logic + DB
│   ├── database/             ← Schema SQL, migrations
│   └── src/
│       ├── database/         ← TypeORM entities, repositories, migrations
│       ├── lesson/           ← Orchestrator, step engine, prompt builder, loader
│       ├── cache/            ← Cache warmer, cached feedback service
│       ├── session/          ← Session manager, session router
│       ├── mqtt/             ← MQTT publish/subscribe
│       ├── audio/            ← WebSocket gateway nhận audio từ Python
│       ├── free-talk/        ← Free talk handler
│       ├── pronunciation/    ← Pronunciation service
│       ├── progress/         ← Lesson progress, step attempts
│       └── app.module.ts     ← Import AiCoreModule
│
├── ai-service/               ← NestJS: AI adapters (LLM, TTS, STT, Pronunciation)
└── customer-service/         ← NestJS: CSKH
```

---

## 13. Phân chia Phase triển khai

```
Phase 1 (Tuần 1-2):   Foundation — Nx monorepo + libs/ai-core + adapters
Phase 2 (Tuần 3-4):   Data Layer — Database + backend client + pipeline services
Phase 3 (Tuần 5-6):   AI Service — NestJS microservice expose AI qua HTTP
Phase 4 (Tuần 7-8):   Voice Streaming Refactor — Python gọi ai-service
Phase 5 (Tuần 9-10):  Lesson System — Orchestrator + MQTT + Pronunciation
Phase 6 (Tuần 11+):   Customer Service — CSKH app reuse ai-core
Phase 7 (Tuần 13+):   Scale — Cache, queue, horizontal scale, monitoring
```

---

## 14. Step Completion Engine — Logic chuyển step

### 14.1. Nguyên tắc

Orchestrator KHÔNG hỏi LLM "có nên chuyển step không?". Mỗi step type có điều kiện hoàn thành (completion condition) xác định trước. Orchestrator check điều kiện này bằng logic thuần, không gọi LLM.

```
LLM chỉ được gọi SAU KHI Orchestrator đã quyết định chuyển step,
để generate feedback phù hợp (khen / động viên / hướng dẫn).
```

### 14.2. Completion conditions theo step type

| Step type | Điều kiện PASS (advance) | Điều kiện FAIL (vẫn advance) | Timeout |
|-----------|--------------------------|------------------------------|---------|
| `teach_with_image` | TTS phát xong audio | — | — |
| `pronounce` | `score >= min_score` | `attempt >= max_attempts` | Silence > 15s |
| `image_quiz` | `answer == correct` | `attempt >= max_attempts` | Silence > 30s |
| `voice_quiz` | Nội dung đúng + phát âm đạt | `attempt >= max_attempts` | Silence > 30s |
| `summary` | TTS phát xong audio | — | — |

Kết thúc bài: `current_step >= total_steps`

### 14.3. StepResult — 4 actions

```python
@dataclass
class StepResult:
    action: str          # "advance" | "retry" | "wait" | "nudge"
    reason: str = ""
    passed: bool = False
    score: Optional[float] = None
    correct_answer: Optional[str] = None
    remaining_attempts: int = 0
```

| Action | Ý nghĩa | Orchestrator làm gì |
|--------|---------|---------------------|
| `wait` | Chưa có input, tiếp tục chờ | Không làm gì, chờ event |
| `nudge` | Trẻ im lặng quá lâu (>15s) | TTS: "Bạn ơi, thử nói đi nào!" |
| `retry` | Trả lời sai nhưng còn lượt | LLM feedback + chờ thử lại |
| `advance` | Chuyển step tiếp (dù pass hay fail) | LLM feedback + save result + next step |

### 14.4. StepContext — Track state step hiện tại

```python
@dataclass
class StepContext:
    """State của step đang chạy. Reset khi chuyển step."""
    attempt_count: int = 0
    answer: Optional[str] = None          # đáp án từ touch (MQTT)
    stt_text: Optional[str] = None        # text từ STT (UDP)
    pronunciation_score: Optional[float] = None
    pronunciation_detail: Optional[dict] = None
    tts_completed: bool = False
    silence_duration: float = 0.0
    nudge_count: int = 0
    input_type: Optional[str] = None      # "voice" | "touch"
```

Context được update khi nhận event:
- `voice` event (UDP): cập nhật `stt_text`, `pronunciation_score`, `attempt_count += 1`
- `touch` event (MQTT): cập nhật `answer`, `attempt_count += 1`
- `tts_done` event: cập nhật `tts_completed = True`
- Timeout: cập nhật `silence_duration += elapsed`

### 14.5. StepCompletionEngine — Logic thuần, không gọi LLM

```python
class StepCompletionEngine:
    """Quyết định khi nào chuyển step. Logic thuần."""

    async def check_completion(self, step, context) -> StepResult:
        step_type = step["type"]

        if step_type == "teach_with_image":
            # Hoàn thành khi TTS phát xong
            if context.tts_completed:
                return StepResult(action="advance", reason="teach_done")
            return StepResult(action="wait")

        elif step_type == "pronounce":
            min_score = step.get("min_score", 50)
            max_attempts = step.get("max_attempts", 3)

            if context.pronunciation_score is not None:
                if context.pronunciation_score >= min_score:
                    return StepResult(action="advance", reason="passed",
                                      passed=True, score=context.pronunciation_score)
                if context.attempt_count >= max_attempts:
                    return StepResult(action="advance", reason="max_attempts",
                                      passed=False, score=context.pronunciation_score)
                return StepResult(action="retry", reason="score_low",
                                  remaining_attempts=max_attempts - context.attempt_count)

            if context.silence_duration > 15.0:
                return StepResult(action="advance", reason="timeout", passed=False)
            return StepResult(action="wait")

        elif step_type == "image_quiz":
            max_attempts = step.get("max_attempts", 2)

            if context.answer is not None:
                is_correct = self._match_answer(context.answer, step["correct"], step.get("options", []))
                if is_correct:
                    return StepResult(action="advance", reason="correct", passed=True)
                if context.attempt_count >= max_attempts:
                    return StepResult(action="advance", reason="max_attempts",
                                      passed=False, correct_answer=step["correct"])
                return StepResult(action="retry", reason="wrong")

            if context.silence_duration > 30.0:
                return StepResult(action="advance", reason="timeout", passed=False)
            if context.silence_duration > 15.0:
                return StepResult(action="nudge", reason="remind")
            return StepResult(action="wait")

        elif step_type == "voice_quiz":
            max_attempts = step.get("max_attempts", 3)
            min_pron = step.get("min_pronunciation_score", 0)

            if context.stt_text is not None:
                content_ok = self._fuzzy_match(context.stt_text, step["correct_answer"],
                                                step.get("accept_similar", []))
                pron_ok = (context.pronunciation_score is None
                           or context.pronunciation_score >= min_pron)

                if content_ok and pron_ok:
                    return StepResult(action="advance", reason="correct", passed=True)
                if content_ok and not pron_ok:
                    if context.attempt_count >= max_attempts:
                        return StepResult(action="advance", reason="content_ok_pron_weak", passed=True)
                    return StepResult(action="retry", reason="pronunciation_weak")
                if context.attempt_count >= max_attempts:
                    return StepResult(action="advance", reason="max_attempts", passed=False)
                return StepResult(action="retry", reason="wrong")

            if context.silence_duration > 30.0:
                return StepResult(action="advance", reason="timeout", passed=False)
            return StepResult(action="wait")

        elif step_type == "summary":
            if context.tts_completed:
                return StepResult(action="advance", reason="summary_done")
            return StepResult(action="wait")
```

### 14.6. Orchestrator main loop

```python
class LessonOrchestrator:

    async def run(self):
        """Main loop: chạy từ current_step đến hết."""
        while self.current_step < len(self.steps):
            step = self.steps[self.current_step]
            await self._start_step(step)           # gửi ảnh, phát câu hỏi
            await self._process_until_complete(step) # chờ + xử lý
            if self.paused:
                break

        if self.current_step >= len(self.steps) and not self.paused:
            await self._complete_lesson()

    async def _process_until_complete(self, step):
        """Loop 1 step cho đến khi completion engine nói 'advance'."""
        while True:
            result = await self.completion_engine.check_completion(step, self.context)

            if result.action == "advance":
                await self._give_feedback(step, result)   # gọi LLM feedback
                await self._save_step_result(step, result) # lưu DB
                self.current_step += 1
                self.context.reset()
                await self._save_progress()
                break

            elif result.action == "retry":
                await self._give_retry_feedback(step, result)  # LLM: "Thử lại nhé!"
                self.context.clear_input()
                await self._wait_for_input(step)

            elif result.action == "nudge":
                await self.tts.speak("Bạn ơi, thử nói đi nào!")
                self.context.nudge_count += 1
                await self._wait_for_input(step)

            elif result.action == "wait":
                await self._wait_for_input(step)

    async def _wait_for_input(self, step):
        """Chờ input từ trẻ (voice qua UDP hoặc touch qua MQTT)."""
        try:
            event = await asyncio.wait_for(
                self._listen_for_input(step), timeout=15.0
            )
            self.context.update_from_event(event)
        except asyncio.TimeoutError:
            self.context.silence_duration += 15.0
```

### 14.7. Flow tổng hợp: Orchestrator quyết định, LLM phản hồi

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (logic thuần)                    │
│                                                                 │
│  1. Load step config                                            │
│  2. Gửi ảnh (MQTT) + phát câu hỏi (TTS)                       │
│  3. Chờ input (UDP voice / MQTT touch)                          │
│  4. StepCompletionEngine.check_completion()                     │
│     ├── "wait"    → quay lại bước 3                             │
│     ├── "nudge"   → TTS nhắc nhở → quay lại bước 3             │
│     ├── "retry"   → gọi LLM feedback → quay lại bước 3         │
│     └── "advance" → gọi LLM feedback → lưu DB → step tiếp      │
│  5. current_step >= total_steps? → complete_lesson()            │
│                                                                 │
│  LLM KHÔNG quyết định chuyển step                               │
│  LLM CHỈ generate feedback SAU KHI Orchestrator đã quyết định   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Latency ước tính theo step type

### 15.1. Latency breakdown từng component

| Component | Latency | Ghi chú |
|-----------|---------|---------|
| UDP audio truyền (robot ↔ server) | 5-15ms | Cùng region, private network |
| Opus decode (audio → PCM) | 1-3ms | CPU local |
| STT (Whisper) | 300-800ms | Tùy độ dài audio, constrained nhanh hơn |
| Pronunciation Assessment (Azure) | 500-1200ms | Tùy độ dài từ/câu |
| LLM generate (Gemini Flash) | 200-600ms | Prompt ngắn, response ngắn |
| LLM generate (Cerebras) | 100-300ms | Nhanh nhất |
| LLM generate (Cohere) | 300-800ms | Tùy model |
| TTS (ElevenLabs streaming) | 200-500ms | First chunk, sau đó stream liên tục |
| MQTT publish + robot render ảnh | 50-200ms | Tùy network + robot hardware |
| DB query (PostgreSQL) | 5-20ms | Connection pool, indexed queries |
| Redis cache hit | 1-5ms | Gần như instant |

### 15.2. Latency end-to-end theo step type

**teach_with_image** — AI giảng bài (không cần input từ trẻ)

```
MQTT gửi ảnh (50-200ms) → chờ robot load (100-500ms) → LLM generate lời giảng (200-600ms)
→ TTS first chunk (200-500ms) → UDP stream audio

Tổng từ lúc bắt đầu step → trẻ nghe audio đầu tiên:
  ~550ms - 1.8s (trung bình ~1s)
```

**pronounce** — Trẻ phát âm, AI đánh giá

```
Trẻ nói xong → Pronunciation Assessment (500-1200ms)
→ LLM generate feedback (200-600ms) → TTS (200-500ms) → UDP audio

Tổng từ lúc trẻ nói xong → nghe feedback:
  ~900ms - 2.3s (trung bình ~1.5s)

Với cache (bucket hóa score):
  ~700ms - 1.5s (trung bình ~1s, skip LLM call)
```

**image_quiz** — Trẻ chọn đáp án (touch)

```
Trẻ tap màn hình → MQTT answer (50-100ms) → LLM judge (200-600ms)
→ TTS feedback (200-500ms) → UDP audio

Tổng từ lúc tap → nghe feedback:
  ~450ms - 1.2s (trung bình ~800ms)
```

**image_quiz** — Trẻ chọn đáp án (voice)

```
Trẻ nói → STT constrained (300-800ms) → LLM judge (200-600ms)
→ TTS feedback (200-500ms) → UDP audio

Tổng từ lúc nói xong → nghe feedback:
  ~700ms - 1.9s (trung bình ~1.3s)
```

**voice_quiz** — Trẻ nói tên (STT + Pronunciation song song)

```
Trẻ nói → ┌ STT constrained (300-800ms)      ┐
          └ Pronunciation Assessment (500-1200ms) ┘ chạy song song
→ max(STT, Pronunciation) = 500-1200ms
→ LLM judge (200-600ms) → TTS feedback (200-500ms) → UDP audio

Tổng từ lúc nói xong → nghe feedback:
  ~900ms - 2.3s (trung bình ~1.5s)

Với cache:
  ~700ms - 1.7s (trung bình ~1.2s)
```

### 15.3. Tổng hợp latency

| Step type | Latency (trung bình) | Latency (với cache) | Trẻ cảm nhận |
|-----------|---------------------|--------------------|--------------| 
| teach_with_image | ~1.0s | ~1.0s | Tự nhiên (AI đang "suy nghĩ") |
| pronounce | ~1.5s | ~1.0s | Chấp nhận được |
| image_quiz (touch) | ~0.8s | ~0.5s | Nhanh, mượt |
| image_quiz (voice) | ~1.3s | ~1.0s | Chấp nhận được |
| voice_quiz | ~1.5s | ~1.2s | Chấp nhận được |
| summary | ~1.0s | ~1.0s | Tự nhiên |

### 15.4. Ngưỡng chấp nhận

```
< 1s:    Tuyệt vời — trẻ cảm thấy robot phản hồi tức thì
1-2s:    Tốt — tự nhiên như đang nói chuyện với người
2-3s:    Chấp nhận được — trẻ vẫn kiên nhẫn chờ
> 3s:    Kém — trẻ mất tập trung, cần optimize

Mục tiêu: giữ tất cả steps dưới 2s (trung bình ~1-1.5s)
```

### 15.5. Cách giảm latency

| Kỹ thuật | Giảm được | Áp dụng cho |
|----------|-----------|-------------|
| Redis cache (bucket hóa feedback) | ~200-600ms (skip LLM) | pronounce, voice_quiz |
| TTS streaming (phát chunk đầu tiên ngay) | ~100-300ms | Tất cả steps có audio output |
| STT + Pronunciation chạy song song | ~300-500ms | voice_quiz |
| Pre-load ảnh step tiếp theo | ~100-500ms | Tất cả steps có ảnh |
| LLM model nhanh (Cerebras) | ~100-300ms vs Gemini | Tất cả LLM calls |
| Connection pooling (DB, HTTP) | ~10-50ms | Tất cả |

---

## 16. Tổng kết kiến trúc

```
Robot (Client)
  │
  ├── UDP ──────► voice-streaming (Python, EC2)
  │   audio        ├── CHỈ xử lý UDP/RTP audio
  │                ├── Encode/decode Opus
  │                ├── Detect silence / audio level
  │                └── Forward audio bytes qua WebSocket
  │                         │
  │                         ▼ WebSocket
  │
  ├── MQTT ◄─────► lesson-service (NestJS, Fargate)
  │   image/text   ├── SessionManager
  │   commands     │   ├── Free Talk mode
  │   answers      │   └── Lesson Orchestrator
  │                │       ├── Step Completion Engine (logic thuần)
  │                │       ├── Prompt Builder (build prompt cho mỗi step)
  │                │       └── Cached Feedback Service (Redis → DB → LLM)
  │                ├── MQTT publish/subscribe (ảnh, quiz, commands)
  │                ├── Lesson Cache Warmer (pre-generate khi load bài)
  │                ├── Lesson Progress Service (resume bài dở)
  │                ├── Conversation Service (lịch sử chat)
  │                └── Audio Gateway (WebSocket nhận audio từ Python)
  │                         │
  │                         │ import AiCoreModule (in-process)
  │                         ▼
  │                ai-service (NestJS, Fargate)
  │                    ├── LLM: generate lời giảng, feedback, đánh giá
  │                    ├── TTS: chuyển text → audio
  │                    ├── STT: chuyển audio → text (constrained)
  │                    └── Pronunciation: đánh giá phát âm (Azure)
  │                         │
  │                         ▼
  │                PostgreSQL (RDS) + Redis (ElastiCache)
  │                    ├── courses / lessons / lesson_steps (giáo trình)
  │                    ├── lesson_progress + session_data (tiến độ, resume)
  │                    ├── step_attempts (log từng lần thử)
  │                    ├── conversation_history (lịch sử chat)
  │                    ├── feedback_cache (persistent cache, 3 tầng)
  │                    └── student_word_stats (thống kê từ vựng)
  │
  └── HTTP ──────► Backend API
      lesson pack   ├── Download lesson pack (ảnh, audio mẫu)
      config        ├── Student profile, enrollment
      OTA           └── Robot firmware update
```
