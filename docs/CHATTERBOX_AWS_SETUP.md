# Hướng dẫn Self-Host Chatterbox TTS trên AWS

## Tổng quan

Chatterbox TTS là model text-to-speech open source của Resemble AI, hỗ trợ voice cloning từ vài giây audio mẫu. Tài liệu này hướng dẫn triển khai Chatterbox TTS Server lên AWS EC2 với GPU NVIDIA, phục vụ cho hệ thống robot giáo dục.

### Tại sao Chatterbox?

- Open source (MIT license), miễn phí
- Voice cloning zero-shot (chỉ cần vài giây audio mẫu)
- 3 model: Original (English), Multilingual (23 ngôn ngữ), Turbo (nhanh nhất)
- OpenAI-compatible API (`/v1/audio/speech`)
- Latency ~150-200ms trên GPU
- Self-host = không phụ thuộc API bên ngoài, không giới hạn rate limit

---

## 1. Chọn EC2 Instance

### Khuyến nghị

| Instance | GPU | VRAM | Giá On-Demand | Giá Spot | Phù hợp |
|----------|-----|------|---------------|----------|----------|
| g4dn.xlarge | 1× T4 | 16GB | ~$0.526/h | ~$0.16/h | Dev/test, < 50 concurrent |
| g5.xlarge | 1× A10G | 24GB | ~$1.006/h | ~$0.30/h | Production, 50-200 concurrent |
| g5.2xlarge | 1× A10G | 24GB | ~$1.212/h | ~$0.36/h | Production, cần thêm CPU/RAM |

Khuyến nghị bắt đầu với **g4dn.xlarge** (T4 GPU, ~$0.526/h = ~$380/tháng on-demand, ~$115/tháng spot).

### AMI

Dùng **Deep Learning AMI (Ubuntu)** — đã cài sẵn NVIDIA drivers, CUDA, Docker.

```
AMI: Deep Learning OSS Nvidia Driver AMI GPU PyTorch 2.x (Ubuntu 22.04)
Hoặc: Amazon Linux 2023 + cài NVIDIA drivers thủ công
```


---

## 2. Tạo EC2 Instance

### 2.1. Launch Instance

```bash
# Qua AWS Console hoặc CLI
aws ec2 run-instances \
  --image-id ami-0xxxxxxxxxxxxxxxxx \  # Deep Learning AMI Ubuntu
  --instance-type g4dn.xlarge \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \       # Private subnet (cùng VPC với lesson-service)
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=chatterbox-tts}]'
```

### 2.2. Security Group

```
Inbound:
  - TCP 8004    ← Chatterbox API (chỉ từ lesson-service security group)
  - TCP 22      ← SSH (chỉ từ bastion/VPN)

Outbound:
  - All traffic ← Download models từ Hugging Face, updates
```

### 2.3. SSH vào instance

```bash
ssh -i your-key.pem ubuntu@<private-ip>
```

---

## 3. Cài đặt Chatterbox TTS Server

### 3.1. Kiểm tra GPU

```bash
nvidia-smi
# Phải thấy T4 hoặc A10G với CUDA version
```

### 3.2. Cài Docker + NVIDIA Container Toolkit

Nếu dùng Deep Learning AMI, Docker đã có sẵn. Nếu không:

```bash
# Cài Docker
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# Cài NVIDIA Container Toolkit
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 3.3. Clone và chạy Chatterbox

```bash
# Clone repo
git clone https://github.com/devnen/Chatterbox-TTS-Server.git
cd Chatterbox-TTS-Server

# Chạy với Docker (NVIDIA GPU)
docker compose up -d --build

# Kiểm tra logs
docker compose logs -f
```

Lần đầu chạy sẽ download model từ Hugging Face (~2-3GB), mất vài phút.

### 3.4. Kiểm tra hoạt động

```bash
# Kiểm tra GPU trong container
docker compose exec chatterbox-tts-server nvidia-smi

# Kiểm tra PyTorch
docker compose exec chatterbox-tts-server python3 -c \
  "import torch; print(f'CUDA: {torch.cuda.is_available()}, GPU: {torch.cuda.get_device_name(0)}')"

# Test API
curl -X POST http://localhost:8004/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "Xin chào, tôi là robot giáo viên", "voice": "S1"}' \
  --output test.wav

# Nghe thử
# Download test.wav về máy local để nghe
```

---

## 4. Cấu hình cho Production

### 4.1. config.yaml

```yaml
server:
  host: "0.0.0.0"
  port: 8004
  log_level: "info"

model:
  repo_id: "ResembleAI/chatterbox"

tts_engine:
  device: "auto"                    # tự detect GPU
  predefined_voices_path: "./voices"
  reference_audio_path: "./reference_audio"

generation_defaults:
  temperature: 0.8
  exaggeration: 0.5
  cfg_weight: 0.5
  speed_factor: 0.9                 # chậm hơn chút cho trẻ em
  seed: -1                          # random

audio_output:
  format: "wav"
  sample_rate: 24000
```

### 4.2. Upload custom voice (voice cloning)

```bash
# Chuẩn bị file audio mẫu (5-15 giây, WAV hoặc MP3)
# Giọng rõ ràng, ít noise, 1 người nói

# Copy vào thư mục reference_audio
cp teacher_voice_sample.wav Chatterbox-TTS-Server/reference_audio/

# Hoặc upload qua API
curl -X POST http://localhost:8004/upload_reference \
  -F "file=@teacher_voice_sample.wav"
```

### 4.3. Test voice cloning

```bash
# Dùng custom voice
curl -X POST http://localhost:8004/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Xin chào các em, hôm nay chúng ta học về con vật nhé",
    "voice_mode": "clone",
    "reference_audio_filename": "teacher_voice_sample.wav",
    "speed_factor": 0.9
  }' \
  --output teacher_test.wav
```


---

## 5. Tích hợp với lesson-service (NestJS)

### 5.1. Gọi Chatterbox từ NestJS

Chatterbox cung cấp OpenAI-compatible API, nên có thể dùng adapter tương tự OpenAI TTS:

```typescript
// libs/ai-core/src/adapters/chatterbox-tts.adapter.ts
import { ITtsAdapter } from '../interfaces/tts.interface';

export class ChatterboxTtsAdapter implements ITtsAdapter {
  private readonly baseUrl: string;
  private readonly defaultVoice: string;
  private readonly referenceAudio: string;

  constructor(config: {
    baseUrl: string;      // http://chatterbox-tts.internal:8004
    defaultVoice?: string;
    referenceAudio?: string;
  }) {
    this.baseUrl = config.baseUrl;
    this.defaultVoice = config.defaultVoice || 'S1';
    this.referenceAudio = config.referenceAudio || '';
  }

  async *streamSynthesize(text: string, options?: {
    voiceId?: string;
    speed?: number;
    referenceAudio?: string;
  }): AsyncIterable<Buffer> {
    const useClone = options?.referenceAudio || this.referenceAudio;

    const body = useClone
      ? {
          text,
          voice_mode: 'clone',
          reference_audio_filename: options?.referenceAudio || this.referenceAudio,
          speed_factor: options?.speed || 0.9,
          output_format: 'wav',
        }
      : {
          input: text,
          voice: options?.voiceId || this.defaultVoice,
          speed: options?.speed || 0.9,
          response_format: 'wav',
        };

    const endpoint = useClone ? '/tts' : '/v1/audio/speech';

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield Buffer.from(value);
    }
  }
}
```

### 5.2. Cấu hình trong lesson-service

```typescript
// apps/lesson-service/src/app/app.module.ts
AiCoreModule.register({
  tts: {
    name: 'chatterbox',
    provider: 'chatterbox',
    model: 'chatterbox-multilingual',
    apiKey: '',  // không cần API key (self-host)
    // baseUrl config qua env
  },
})
```

```bash
# apps/lesson-service/.env
TTS_PROVIDER=chatterbox
CHATTERBOX_BASE_URL=http://chatterbox-tts.internal:8004
CHATTERBOX_REFERENCE_AUDIO=teacher_voice_sample.wav
```

### 5.3. Service Discovery

Dùng AWS Cloud Map để lesson-service tìm Chatterbox:

```
Chatterbox EC2: chatterbox-tts.internal → 10.0.1.20:8004
Lesson-service Fargate: gọi http://chatterbox-tts.internal:8004/tts
```

Hoặc đơn giản hơn: hardcode private IP trong .env.

---

## 6. Auto-start & Monitoring

### 6.1. Systemd service (nếu không dùng Docker)

```bash
sudo tee /etc/systemd/system/chatterbox-tts.service << 'EOF'
[Unit]
Description=Chatterbox TTS Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/Chatterbox-TTS-Server
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=10
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable chatterbox-tts
sudo systemctl start chatterbox-tts
```

### 6.2. Health check

```bash
# Cron job kiểm tra mỗi phút
echo "* * * * * curl -sf http://localhost:8004/api/ui/initial-data > /dev/null || docker compose -f /home/ubuntu/Chatterbox-TTS-Server/docker-compose.yml restart" | crontab -
```

### 6.3. CloudWatch monitoring

```bash
# Cài CloudWatch Agent
sudo apt install -y amazon-cloudwatch-agent

# Config: monitor GPU utilization, memory, disk
# /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

---

## 7. Ước tính chi phí

| Resource | Spec | Chi phí/tháng |
|----------|------|--------------|
| EC2 g4dn.xlarge (on-demand) | 1× T4, 4 vCPU, 16GB RAM | ~$380 |
| EC2 g4dn.xlarge (spot) | Giống trên, spot pricing | ~$115 |
| EC2 g4dn.xlarge (reserved 1yr) | Giống trên, reserved | ~$230 |
| EBS gp3 100GB | Storage | ~$8 |
| Data transfer | Trong VPC | ~$0 |
| **Tổng (spot)** | | **~$123/tháng** |
| **Tổng (reserved)** | | **~$238/tháng** |

So sánh với API services:
- ElevenLabs: ~$22-99/tháng (giới hạn characters) → vượt limit nhanh với 5000 sessions
- Fish Audio: ~$500-1500/tháng cho production traffic
- Chatterbox self-host: ~$123-238/tháng, KHÔNG giới hạn

---

## 8. Scale khi cần

### 8.1. Vertical scale

```
g4dn.xlarge (T4, 16GB VRAM)  → 50-200 concurrent TTS requests
g5.xlarge (A10G, 24GB VRAM)  → 200-500 concurrent TTS requests
g5.2xlarge (A10G, 24GB VRAM) → 500+ (thêm CPU/RAM cho pre/post processing)
```

### 8.2. Horizontal scale (nhiều instances)

```
Chatterbox-1 (10.0.1.20:8004) ← lesson-service round-robin
Chatterbox-2 (10.0.1.21:8004) ← hoặc NLB
```

Dùng NLB (Network Load Balancer) internal để load balance giữa nhiều Chatterbox instances.

---

## 9. Checklist triển khai

```
[ ] 1. Tạo EC2 g4dn.xlarge trong private subnet
[ ] 2. Security group: chỉ cho lesson-service truy cập port 8004
[ ] 3. SSH vào, kiểm tra nvidia-smi
[ ] 4. Cài Docker + NVIDIA Container Toolkit
[ ] 5. Clone Chatterbox-TTS-Server
[ ] 6. docker compose up -d --build
[ ] 7. Chờ model download (~5 phút lần đầu)
[ ] 8. Test API: curl POST /v1/audio/speech
[ ] 9. Upload custom voice vào reference_audio/
[ ] 10. Test voice cloning: curl POST /tts với voice_mode=clone
[ ] 11. Cấu hình systemd auto-start
[ ] 12. Cấu hình health check
[ ] 13. Cập nhật lesson-service .env: CHATTERBOX_BASE_URL
[ ] 14. Test end-to-end: lesson-service → Chatterbox → audio
```

---

## 10. Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| `nvidia-smi` không thấy GPU | Kiểm tra instance type có GPU, cài NVIDIA drivers |
| Docker không thấy GPU | Cài nvidia-container-toolkit, restart Docker |
| Model download chậm/fail | Kiểm tra internet, tăng EBS size nếu hết disk |
| CUDA out of memory | Giảm concurrent requests, hoặc upgrade lên g5.xlarge |
| Voice clone chất lượng kém | Dùng audio mẫu rõ ràng, ít noise, 10-15 giây, 1 người nói |
| Latency cao (>500ms) | Kiểm tra GPU utilization, xem có bị CPU bottleneck không |
| Connection refused từ lesson-service | Kiểm tra security group, private IP, port 8004 |
