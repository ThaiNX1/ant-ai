-- ============================================================================
-- VOICE STREAMING — DATABASE SCHEMA
-- PostgreSQL 15+
-- ============================================================================

-- ============================================================================
-- 1. GIÁO TRÌNH (Curriculum)
-- ============================================================================

CREATE TABLE IF NOT EXISTS courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,              -- "English for Kids - Level 1"
    description     TEXT,
    target_age_min  INT NOT NULL DEFAULT 6,             -- tuổi tối thiểu
    target_age_max  INT NOT NULL DEFAULT 10,            -- tuổi tối đa
    language        VARCHAR(10) NOT NULL DEFAULT 'en',  -- ngôn ngữ chính
    total_lessons   INT NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
    cover_image_url VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    order_index     INT NOT NULL,                       -- thứ tự bài trong khóa (1, 2, 3...)
    title           VARCHAR(255) NOT NULL,              -- "Animals - Lesson 1"
    description     TEXT,
    total_steps     INT NOT NULL DEFAULT 0,
    asset_pack_url  VARCHAR(500),                       -- URL download lesson pack (ảnh, audio mẫu)
    asset_pack_size INT,                                -- bytes, để robot biết dung lượng trước khi download
    estimated_duration_min INT,                         -- thời lượng ước tính (phút)
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (course_id, order_index)
);

CREATE TABLE IF NOT EXISTS lesson_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    step_index      INT NOT NULL,                       -- 1, 2, 3...
    type            VARCHAR(30) NOT NULL,               -- teach_with_image, pronounce, image_quiz, voice_quiz, summary
    config          JSONB NOT NULL DEFAULT '{}',        -- toàn bộ config của step
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (lesson_id, step_index)
);

-- ============================================================================
-- lesson_steps.config JSONB examples:
-- ============================================================================
--
-- teach_with_image:
--   {
--     "image_url": "lessons/animals/elephant.jpg",
--     "audio_text": "This is an elephant. Can you say elephant?",
--     "word": "elephant",
--     "phonetic": "/ˈɛl.ɪ.fənt/"
--   }
--
-- pronounce:
--   {
--     "image_url": "lessons/animals/elephant.jpg",
--     "word": "elephant",
--     "phonetic": "/ˈɛl.ɪ.fənt/",
--     "min_score": 50,
--     "max_attempts": 3
--   }
--
-- image_quiz:
--   {
--     "question_audio": "Which one is the elephant?",
--     "options": [
--       {"id": "A", "image_url": "lessons/animals/cat.jpg", "label": "Cat"},
--       {"id": "B", "image_url": "lessons/animals/elephant.jpg", "label": "Elephant"},
--       {"id": "C", "image_url": "lessons/animals/dog.jpg", "label": "Dog"}
--     ],
--     "correct": "B",
--     "accept_voice": true,
--     "accept_touch": true,
--     "max_attempts": 2
--   }
--
-- voice_quiz:
--   {
--     "image_url": "lessons/animals/cat.jpg",
--     "question_audio": "What animal is this? Say it in English!",
--     "correct_answer": "cat",
--     "accept_similar": ["cat", "kat", "cát"],
--     "min_pronunciation_score": 50,
--     "max_attempts": 3
--   }
--
-- summary:
--   {
--     "content": "Hôm nay chúng ta đã học elephant, cat, dog. Giỏi lắm!"
--   }


-- ============================================================================
-- 2. HỌC SINH (Students)
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    gender          VARCHAR(10),                        -- male, female, other
    avatar_url      VARCHAR(500),
    native_language VARCHAR(10) DEFAULT 'vi',           -- ngôn ngữ mẹ đẻ
    difficulty_level VARCHAR(20) DEFAULT 'normal',      -- easy, normal, hard
    profile         JSONB NOT NULL DEFAULT '{}',        -- preferences, voice settings, etc.
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 3. ROBOT (Devices)
-- ============================================================================

CREATE TABLE IF NOT EXISTS robots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    robot_id        VARCHAR(100) NOT NULL UNIQUE,       -- hardware ID / serial number
    name            VARCHAR(100),                       -- tên robot (đặt bởi user)
    model           VARCHAR(50),                        -- model phần cứng
    firmware_version VARCHAR(20),
    status          VARCHAR(20) NOT NULL DEFAULT 'offline', -- online, offline, maintenance
    last_seen_at    TIMESTAMP,
    ip_address      VARCHAR(45),                        -- IPv4/IPv6 lần kết nối gần nhất
    config          JSONB NOT NULL DEFAULT '{}',        -- volume, brightness, wifi, etc.
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 4. STUDENT ↔ ROBOT (Liên kết học sinh với robot)
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_robots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    robot_id        UUID NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
    is_primary      BOOLEAN NOT NULL DEFAULT true,      -- robot chính của học sinh
    linked_at       TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (student_id, robot_id)
);


-- ============================================================================
-- 5. ĐĂNG KÝ KHÓA HỌC (Enrollments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, paused, cancelled
    progress_pct    FLOAT NOT NULL DEFAULT 0,           -- 0-100, % hoàn thành khóa
    started_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (student_id, course_id)
);


-- ============================================================================
-- 6. TIẾN ĐỘ BÀI HỌC (Lesson Progress) — KEY cho resume
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    robot_id        UUID REFERENCES robots(id),         -- robot nào đang học
    status          VARCHAR(20) NOT NULL DEFAULT 'not_started',
                    -- not_started, in_progress, paused, completed
    current_step    INT NOT NULL DEFAULT 0,             -- step đang làm dở (0-based)
    total_steps     INT NOT NULL,
    score           FLOAT,                              -- điểm tổng bài (0-100)
    passed_steps    INT NOT NULL DEFAULT 0,             -- số step đã pass
    failed_steps    INT NOT NULL DEFAULT 0,             -- số step fail (hết attempts)
    skipped_steps   INT NOT NULL DEFAULT 0,             -- số step bị timeout/skip
    session_data    JSONB NOT NULL DEFAULT '{}',        -- state snapshot để resume
    started_at      TIMESTAMP,
    paused_at       TIMESTAMP,
    paused_reason   VARCHAR(50),                        -- disconnect, user_pause, timeout, battery_low
    completed_at    TIMESTAMP,
    total_duration_sec INT NOT NULL DEFAULT 0,          -- tổng thời gian học (giây)
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- session_data JSONB example:
-- {
--   "current_step": 4,
--   "step_state": {
--     "attempt_count": 1,
--     "hints_given": [0],
--     "last_answer": "dog"
--   },
--   "scores_so_far": {
--     "step_1": {"score": 85, "attempts": 1, "passed": true},
--     "step_2": {"score": 72, "attempts": 2, "passed": true},
--     "step_3": {"score": 100, "attempts": 1, "passed": true}
--   },
--   "conversation_context": [
--     {"role": "ai", "content": "What animal is this?"},
--     {"role": "student", "content": "dog"},
--     {"role": "ai", "content": "Not quite! Look again..."}
--   ]
-- }


-- ============================================================================
-- 7. LOG TỪNG LẦN THỬ (Step Attempts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS step_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_progress_id  UUID NOT NULL REFERENCES lesson_progress(id) ON DELETE CASCADE,
    step_index          INT NOT NULL,                   -- step nào trong bài
    step_type           VARCHAR(30) NOT NULL,            -- pronounce, image_quiz, voice_quiz...
    attempt_number      INT NOT NULL,                   -- lần thử thứ mấy (1, 2, 3...)
    input_type          VARCHAR(20),                    -- voice, touch, timeout
    stt_text            VARCHAR(500),                   -- STT nhận được gì
    stt_confidence      FLOAT,                          -- STT confidence score (0-1)
    pronunciation_score FLOAT,                          -- điểm phát âm tổng (0-100)
    pronunciation_detail JSONB,                         -- chi tiết từng phoneme
    selected_option     VARCHAR(10),                    -- đáp án chọn (A, B, C...) cho quiz
    is_correct          BOOLEAN NOT NULL DEFAULT false,
    completion_reason   VARCHAR(30),                    -- passed, max_attempts, timeout, skip
    feedback_given      TEXT,                           -- AI feedback đã nói cho trẻ
    duration_ms         INT,                            -- thời gian từ lúc hỏi → trẻ trả lời (ms)
    audio_url           VARCHAR(500),                   -- URL audio recording (optional, để review)
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- pronunciation_detail JSONB example:
-- {
--   "phonemes": [
--     {"phoneme": "/ɛ/", "score": 95, "status": "correct"},
--     {"phoneme": "/l/", "score": 35, "status": "mispronunciation", "actual": "/w/"},
--     {"phoneme": "/f/", "score": 90, "status": "correct"}
--   ],
--   "accuracy_score": 72,
--   "fluency_score": 80,
--   "completeness_score": 95
-- }


-- ============================================================================
-- 8. LỊCH SỬ TRÒ CHUYỆN (Conversation History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    robot_id        UUID REFERENCES robots(id),
    session_id      VARCHAR(100) NOT NULL,              -- group theo phiên kết nối
    mode            VARCHAR(20) NOT NULL,               -- free_talk, lesson
    lesson_id       UUID REFERENCES lessons(id),        -- NULL nếu free_talk
    role            VARCHAR(20) NOT NULL,               -- student, ai, system
    content         TEXT NOT NULL,
    audio_duration_ms INT,                              -- độ dài audio (ms)
    metadata        JSONB NOT NULL DEFAULT '{}',        -- thêm info nếu cần
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 9. PHIÊN HỌC (Learning Sessions) — Track mỗi lần robot kết nối
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    robot_id        UUID NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
    session_type    VARCHAR(20) NOT NULL,               -- free_talk, lesson, mixed
    lesson_id       UUID REFERENCES lessons(id),        -- NULL nếu free_talk
    lesson_progress_id UUID REFERENCES lesson_progress(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active, ended, disconnected
    started_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMP,
    end_reason      VARCHAR(30),                        -- completed, user_exit, disconnect, battery, timeout
    duration_sec    INT,                                -- tổng thời gian phiên (giây)
    messages_count  INT NOT NULL DEFAULT 0,             -- số tin nhắn trong phiên
    metadata        JSONB NOT NULL DEFAULT '{}',        -- network quality, robot battery, etc.
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 10. THỐNG KÊ HỌC TẬP (Student Analytics) — Aggregate cho dashboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_word_stats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    word            VARCHAR(100) NOT NULL,              -- từ vựng
    language        VARCHAR(10) NOT NULL DEFAULT 'en',
    total_attempts  INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    best_pronunciation_score FLOAT,                     -- điểm phát âm cao nhất
    avg_pronunciation_score FLOAT,                      -- điểm phát âm trung bình
    last_practiced_at TIMESTAMP,
    mastery_level   VARCHAR(20) NOT NULL DEFAULT 'new', -- new, learning, practiced, mastered
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (student_id, word, language)
);


-- ============================================================================
-- 11. INDEXES
-- ============================================================================

-- Giáo trình
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_steps_lesson ON lesson_steps(lesson_id, step_index);

-- Học sinh + Robot
CREATE INDEX IF NOT EXISTS idx_student_robots_student ON student_robots(student_id);
CREATE INDEX IF NOT EXISTS idx_student_robots_robot ON student_robots(robot_id);
CREATE INDEX IF NOT EXISTS idx_robots_robot_id ON robots(robot_id);

-- Tiến độ
CREATE INDEX IF NOT EXISTS idx_progress_student ON lesson_progress(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON lesson_progress(status) WHERE status IN ('in_progress', 'paused');
CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON lesson_progress(enrollment_id);

-- Attempts
CREATE INDEX IF NOT EXISTS idx_attempts_progress ON step_attempts(lesson_progress_id, step_index);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON step_attempts(created_at);

-- Conversation
CREATE INDEX IF NOT EXISTS idx_conversation_session ON conversation_history(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_student ON conversation_history(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_mode ON conversation_history(mode);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_student ON learning_sessions(student_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_robot ON learning_sessions(robot_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON learning_sessions(status) WHERE status = 'active';

-- Word stats
CREATE INDEX IF NOT EXISTS idx_word_stats_student ON student_word_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_word_stats_mastery ON student_word_stats(student_id, mastery_level);


-- ============================================================================
-- 12. FEEDBACK CACHE (Persistent — học từ dữ liệu thực tế)
-- ============================================================================

-- Lưu feedback đã generate từ LLM, dùng làm persistent cache.
-- Khi Redis miss → load từ bảng này → không cần gọi LLM lại.
-- Dữ liệu tích lũy theo thời gian, càng dùng càng đầy đủ.

CREATE TABLE IF NOT EXISTS feedback_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key       VARCHAR(255) NOT NULL UNIQUE,       -- pron:elephant:good:/l/ hoặc quiz:cat:correct
    cache_type      VARCHAR(20) NOT NULL,               -- pronunciation, quiz
    word            VARCHAR(100),                       -- từ vựng liên quan
    score_bucket    VARCHAR(20),                        -- excellent, good, medium, low
    weak_phoneme    VARCHAR(20),                        -- /l/, /θ/, general...
    feedback_text   TEXT NOT NULL,                      -- nội dung feedback từ LLM
    source          VARCHAR(20) NOT NULL DEFAULT 'llm', -- llm (generate mới), warm (pre-generate)
    hit_count       INT NOT NULL DEFAULT 0,             -- số lần được sử dụng
    last_hit_at     TIMESTAMP,
    lesson_id       UUID REFERENCES lessons(id),        -- bài học nào generate ra
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_cache_key ON feedback_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_feedback_cache_type ON feedback_cache(cache_type, word);
CREATE INDEX IF NOT EXISTS idx_feedback_cache_hits ON feedback_cache(hit_count DESC);
