# Hướng dẫn Setup Local Dev — Mac Mini + Windows

## Tổng quan kiến trúc

```
LAN (192.168.x.x)
  │
  ├── Mac Mini M4 16GB (192.168.1.10)
  │     ├── Chatterbox TTS Server    :8004   (MPS acceleration)
  │     └── PostgreSQL 16            :5432
  │
  ├── Windows PC (192.168.1.20)
  │     ├── lesson-service (NestJS)  :8083
  │     ├── ai-service (NestJS)      :8081
  │     ├── Redis                    :6379   (Docker)
  │     ├── MQTT Broker (Mosquitto)  :1883   (Docker)
  │     └── voice-streaming (Python) :5004   (UDP)
  │
  └── Robot (192.168.1.xxx)
        ├── UDP audio ──► 192.168.1.20:5004
        ├── MQTT ──► 192.168.1.20:1883
        └── HTTP (lesson pack) ──► 192.168.1.20:8083
```

---

## Phần 1: Mac Mini M4 (Chatterbox + PostgreSQL)

### 1.1. Chuẩn bị Mac Mini

```bash
# Đặt IP tĩnh
# System Settings → Network → Ethernet → Details → TCP/IP
#   Configure IPv4: Manual
#   IP Address: 192.168.1.10
#   Subnet Mask: 255.255.255.0
#   Router: 192.168.1.1

# Tắt sleep (quan trọng — server phải chạy 24/7)
sudo pmset -a sleep 0 displaysleep 0 disksleep 0

# Cài Homebrew (nếu chưa có)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài tools cần thiết
brew install python@3.10 git ffmpeg
```

### 1.2. Cài PostgreSQL

```bash
# Cài PostgreSQL 16
brew install postgresql@16

# Start service
brew services start postgresql@16

# Tạo database
createdb ai_platform

# Tạo password cho user postgres
psql -c "ALTER USER $(whoami) PASSWORD 'your_db_password';"
# Hoặc tạo user riêng:
psql -c "CREATE USER ai_admin WITH PASSWORD 'your_db_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_platform TO ai_admin;"
```

### 1.3. Cho phép PostgreSQL kết nối từ LAN

```bash
# Tìm đường dẫn config
psql -c "SHOW config_file;"
# Thường là: /opt/homebrew/var/postgresql@16/postgresql.conf

# Sửa postgresql.conf — cho phép listen từ mọi IP
sed -i '' "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" \
  /opt/homebrew/var/postgresql@16/postgresql.conf
```

```bash
# Sửa pg_hba.conf — cho phép kết nối từ LAN
echo "host all all 192.168.1.0/24 md5" >> \
  /opt/homebrew/var/postgresql@16/pg_hba.conf

# Restart PostgreSQL
brew services restart postgresql@16
```

### 1.4. Import schema

```bash
# Từ thư mục project
psql -d ai_platform -f apps/lesson-service/database/schema.sql

# Verify
psql -d ai_platform -c "\dt"
# Phải thấy tất cả bảng: courses, lessons, lesson_steps, students, ...
```


### 1.5. Cài Chatterbox TTS Server

```bash
# Clone repo
cd ~
git clone https://github.com/devnen/Chatterbox-TTS-Server.git
cd Chatterbox-TTS-Server

# Tạo venv với Python 3.10
python3.10 -m venv venv
source venv/bin/activate

# Cài PyTorch với MPS support (Apple Silicon)
pip install --upgrade pip
pip install torch torchvision torchaudio

# Cài Chatterbox (không deps để tránh conflict)
pip install --no-deps git+https://github.com/devnen/chatterbox-v2.git@master

# Cài server dependencies
pip install fastapi 'uvicorn[standard]' librosa safetensors soundfile \
  pydub audiotsm praat-parselmouth python-multipart requests aiofiles \
  PyYAML watchdog unidecode inflect tqdm

# Cài Chatterbox dependencies
pip install conformer==0.3.2 diffusers==0.29.0 resemble-perth==1.0.1 transformers==4.46.3
pip install --no-deps s3tokenizer
pip install onnx==1.16.0 descript-audio-codec
```

### 1.6. Cấu hình Chatterbox

```bash
# Sửa config.yaml (tạo mới nếu chưa có, server sẽ tự tạo lần đầu chạy)
cat > config.yaml << 'EOF'
server:
  host: "0.0.0.0"
  port: 8004
  log_level: "info"

model:
  repo_id: "ResembleAI/chatterbox"

tts_engine:
  device: "mps"
  predefined_voices_path: "./voices"
  reference_audio_path: "./reference_audio"

generation_defaults:
  temperature: 0.8
  exaggeration: 0.5
  cfg_weight: 0.5
  speed_factor: 0.9
  seed: -1

audio_output:
  format: "wav"
  sample_rate: 24000
EOF
```

### 1.7. Verify MPS hoạt động

```bash
source venv/bin/activate
python -c "import torch; print(f'MPS available: {torch.backends.mps.is_available()}')"
# Output: MPS available: True
```

### 1.8. Upload custom voice (voice cloning)

```bash
# Chuẩn bị file audio mẫu giọng giáo viên
# Yêu cầu: 5-15 giây, WAV hoặc MP3, giọng rõ ràng, ít noise, 1 người nói
cp /path/to/teacher_voice_sample.wav ~/Chatterbox-TTS-Server/reference_audio/
```

### 1.9. Chạy Chatterbox

```bash
cd ~/Chatterbox-TTS-Server
source venv/bin/activate
python server.py

# Lần đầu chạy sẽ download model từ Hugging Face (~2-3GB)
# Chờ vài phút cho đến khi thấy: "Uvicorn running on http://0.0.0.0:8004"
```

### 1.10. Test từ Mac Mini

```bash
# Test predefined voice
curl -X POST http://localhost:8004/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "Xin chào các em", "voice": "S1"}' \
  --output test_predefined.wav

# Test voice cloning
curl -X POST http://localhost:8004/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hôm nay chúng ta học về con vật nhé",
    "voice_mode": "clone",
    "reference_audio_filename": "teacher_voice_sample.wav",
    "speed_factor": 0.9
  }' \
  --output test_clone.wav

# Mở Web UI
open http://localhost:8004
```

### 1.11. Chạy Chatterbox như service (auto-start khi reboot)

```bash
# Tạo LaunchAgent
cat > ~/Library/LaunchAgents/com.chatterbox.tts.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.chatterbox.tts</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/YOUR_USERNAME/Chatterbox-TTS-Server/venv/bin/python</string>
        <string>/Users/YOUR_USERNAME/Chatterbox-TTS-Server/server.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/Chatterbox-TTS-Server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/Chatterbox-TTS-Server/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/Chatterbox-TTS-Server/logs/stderr.log</string>
</dict>
</plist>
EOF

# Thay YOUR_USERNAME bằng username thật
sed -i '' "s/YOUR_USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.chatterbox.tts.plist

# Tạo thư mục logs
mkdir -p ~/Chatterbox-TTS-Server/logs

# Load service
launchctl load ~/Library/LaunchAgents/com.chatterbox.tts.plist

# Kiểm tra
launchctl list | grep chatterbox
```

### 1.12. Firewall Mac Mini

```bash
# Mở port cho LAN access
# System Settings → Network → Firewall → Options
# Hoặc tắt firewall cho dev (không khuyến nghị cho production):
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```


---

## Phần 2: Windows PC (NestJS services + Redis + MQTT + Python)

### 2.1. Chuẩn bị Windows

```
IP tĩnh: 192.168.1.20
  Settings → Network → Ethernet → IP assignment → Edit → Manual
  IP: 192.168.1.20
  Subnet: 255.255.255.0
  Gateway: 192.168.1.1
  DNS: 8.8.8.8
```

### 2.2. Cài prerequisites

```powershell
# Node.js 20+ (LTS)
winget install OpenJS.NodeJS.LTS

# Python 3.10
winget install Python.Python.3.10

# Git
winget install Git.Git

# Docker Desktop (cho Redis + MQTT)
winget install Docker.DockerDesktop

# Restart terminal sau khi cài
```

### 2.3. Chạy Redis + MQTT (Docker)

```powershell
# Tạo docker-compose.yml cho infrastructure
```

Tạo file `docker-compose.infra.yml` ở root project:

```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./docker/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
      - mosquitto_log:/mosquitto/log
    restart: unless-stopped

volumes:
  redis_data:
  mosquitto_data:
  mosquitto_log:
```

```powershell
# Tạo config Mosquitto
mkdir -p docker/mosquitto
```

Tạo file `docker/mosquitto/mosquitto.conf`:

```
listener 1883
allow_anonymous true
listener 9001
protocol websockets
```

```powershell
# Chạy infrastructure
docker compose -f docker-compose.infra.yml up -d

# Verify
docker compose -f docker-compose.infra.yml ps
# redis       → running, port 6379
# mosquitto   → running, port 1883
```

### 2.4. Verify kết nối đến Mac Mini

```powershell
# Test PostgreSQL
psql -h 192.168.1.10 -U ai_admin -d ai_platform -c "SELECT 1;"
# Hoặc nếu không có psql, dùng:
docker run --rm postgres:16-alpine psql -h 192.168.1.10 -U ai_admin -d ai_platform -c "SELECT 1;"

# Test Chatterbox
curl -X POST http://192.168.1.10:8004/v1/audio/speech -H "Content-Type: application/json" -d "{\"input\": \"hello\", \"voice\": \"S1\"}" --output test.wav
```

### 2.5. Cấu hình .env cho NestJS services

`apps/ai-service/.env`:

```env
PORT=8081
NODE_ENV=development
LOG_LEVEL=info

LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_key

TTS_PROVIDER=chatterbox
CHATTERBOX_BASE_URL=http://192.168.1.10:8004

STT_PROVIDER=openai
STT_MODEL=whisper-1
OPENAI_API_KEY=your_openai_key

DB_HOST=192.168.1.10
DB_PORT=5432
DB_USERNAME=ai_admin
DB_PASSWORD=your_db_password
DB_DATABASE=ai_platform
```

`apps/lesson-service/.env`:

```env
PORT=8083
NODE_ENV=development
LOG_LEVEL=info

# PostgreSQL trên Mac Mini
DB_HOST=192.168.1.10
DB_PORT=5432
DB_USERNAME=ai_admin
DB_PASSWORD=your_db_password
DB_DATABASE=ai_platform

# Redis local
REDIS_HOST=localhost
REDIS_PORT=6379

# MQTT local
MQTT_BROKER_URL=mqtt://localhost:1883

# Chatterbox TTS trên Mac Mini
TTS_PROVIDER=chatterbox
CHATTERBOX_BASE_URL=http://192.168.1.10:8004
CHATTERBOX_REFERENCE_AUDIO=teacher_voice_sample.wav

# LLM (API bên ngoài)
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_key

# STT (API bên ngoài)
STT_PROVIDER=openai
STT_MODEL=whisper-1
OPENAI_API_KEY=your_openai_key

# Azure Pronunciation Assessment
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=southeastasia
```

### 2.6. Cài dependencies và chạy NestJS

```powershell
# Cài npm dependencies (từ root project)
npm install

# Chạy ai-service
npx nx serve ai-service
# → http://localhost:8081

# Mở terminal mới, chạy lesson-service
npx nx serve lesson-service
# → http://localhost:8083
```

### 2.7. Chạy Python voice-streaming

```powershell
# Mở terminal mới
cd apps/voice-streaming

# Tạo venv
python -m venv venv
.\venv\Scripts\activate

# Cài dependencies
pip install -r requirements.txt

# Cấu hình .env
# LESSON_SERVICE_WS_URL=ws://localhost:8083/audio
# UDP_PORT=5004

# Chạy
python main.py
# → Listening UDP on 0.0.0.0:5004
```

### 2.8. Windows Firewall

```powershell
# Mở port cho robot kết nối
netsh advfirewall firewall add rule name="Voice Streaming UDP" dir=in action=allow protocol=UDP localport=5004
netsh advfirewall firewall add rule name="MQTT" dir=in action=allow protocol=TCP localport=1883
netsh advfirewall firewall add rule name="Lesson Service" dir=in action=allow protocol=TCP localport=8083
netsh advfirewall firewall add rule name="AI Service" dir=in action=allow protocol=TCP localport=8081
```


---

## Phần 3: Verify toàn bộ hệ thống

### 3.1. Checklist

```
Mac Mini (192.168.1.10):
  [ ] IP tĩnh đã set
  [ ] Sleep đã tắt
  [ ] PostgreSQL chạy, port 5432 mở cho LAN
  [ ] Schema đã import, bảng đã tạo
  [ ] Chatterbox chạy, port 8004 mở cho LAN
  [ ] MPS acceleration hoạt động
  [ ] Custom voice đã upload (nếu cần)

Windows (192.168.1.20):
  [ ] IP tĩnh đã set
  [ ] Docker Desktop chạy
  [ ] Redis chạy (port 6379)
  [ ] Mosquitto MQTT chạy (port 1883)
  [ ] ai-service chạy (port 8081)
  [ ] lesson-service chạy (port 8083)
  [ ] voice-streaming chạy (UDP port 5004)
  [ ] Firewall đã mở các port cần thiết
```

### 3.2. Test kết nối cross-machine

```powershell
# Từ Windows → Mac Mini
# Test PostgreSQL
curl http://192.168.1.10:8004/api/ui/initial-data
# Phải trả về JSON với server info

# Test Chatterbox TTS
curl -X POST http://192.168.1.10:8004/v1/audio/speech `
  -H "Content-Type: application/json" `
  -d '{"input": "test", "voice": "S1"}' `
  --output test.wav
# Phải tạo file test.wav
```

```bash
# Từ Mac Mini → Windows (nếu cần test ngược)
curl http://192.168.1.20:8083/health
curl http://192.168.1.20:8081/health
```

### 3.3. Test full flow

```
1. Robot kết nối UDP → Windows:5004 (voice-streaming)
2. voice-streaming forward audio → lesson-service:8083 (WebSocket)
3. lesson-service gọi STT (OpenAI API) → nhận text
4. lesson-service gọi LLM (Gemini API) → nhận response text
5. lesson-service gọi Chatterbox (Mac Mini:8004) → nhận audio
6. lesson-service gửi audio → voice-streaming (WebSocket)
7. voice-streaming encode Opus → UDP → Robot phát loa
```

---

## Phần 4: Các lệnh thường dùng

### Mac Mini

```bash
# Khởi động tất cả
brew services start postgresql@16
cd ~/Chatterbox-TTS-Server && source venv/bin/activate && python server.py

# Kiểm tra services
brew services list
lsof -i :5432    # PostgreSQL
lsof -i :8004    # Chatterbox

# Xem logs Chatterbox
tail -f ~/Chatterbox-TTS-Server/logs/stderr.log

# Restart PostgreSQL
brew services restart postgresql@16

# Restart Chatterbox (nếu dùng LaunchAgent)
launchctl stop com.chatterbox.tts
launchctl start com.chatterbox.tts
```

### Windows

```powershell
# Khởi động infrastructure
docker compose -f docker-compose.infra.yml up -d

# Khởi động NestJS services
npx nx serve ai-service        # Terminal 1
npx nx serve lesson-service     # Terminal 2

# Khởi động Python voice-streaming
cd apps\voice-streaming
.\venv\Scripts\activate
python main.py                  # Terminal 3

# Kiểm tra ports
netstat -an | findstr "8081 8083 5004 6379 1883"

# Restart infrastructure
docker compose -f docker-compose.infra.yml restart

# Xem logs
docker compose -f docker-compose.infra.yml logs -f redis
docker compose -f docker-compose.infra.yml logs -f mosquitto
```

---

## Phần 5: Troubleshooting

| Vấn đề | Kiểm tra | Giải pháp |
|--------|----------|-----------|
| Windows không kết nối được PostgreSQL trên Mac | `ping 192.168.1.10` | Kiểm tra IP tĩnh, firewall Mac, pg_hba.conf |
| Chatterbox trả lời chậm (>1s) | `Activity Monitor → GPU` | Kiểm tra MPS đang active, không bị fallback CPU |
| Redis connection refused | `docker ps` | Kiểm tra Docker Desktop đang chạy |
| MQTT không nhận message | `docker logs mosquitto` | Kiểm tra mosquitto.conf, port 1883 |
| Robot không gửi được UDP | `netstat -an \| findstr 5004` | Kiểm tra Windows Firewall, voice-streaming đang chạy |
| NestJS không start | Xem terminal error | Kiểm tra .env, DB connection, npm install |
| Chatterbox "MPS not available" | `python -c "import torch; ..."` | Cài lại PyTorch: `pip install torch torchvision torchaudio` |
| PostgreSQL "connection refused" | `brew services list` | `brew services restart postgresql@16` |
| Model download fail | Kiểm tra internet Mac Mini | Retry: restart Chatterbox server |

---

## Phần 6: Khi nào chuyển lên AWS

```
Giai đoạn          Infra                          Concurrent users
─────────────────────────────────────────────────────────────────
Dev/Test            Mac Mini + Windows (local)     1-5
Demo khách hàng     Mac Mini + Windows (local)     5-20
Pilot production    Mac Mini (tất cả services)     20-30
Production nhỏ      1 EC2 g4dn.xlarge (AWS)        30-200
Production lớn      Multi EC2 + Fargate (AWS)      200-5000+
```
