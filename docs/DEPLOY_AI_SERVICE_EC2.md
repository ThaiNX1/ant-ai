# Deploy ai-service lên EC2

Tài liệu này dùng cho `apps/ai-service`: GitHub Actions build Docker image, push lên ECR, sau đó EC2 pull image và chạy container sau Nginx.

## Kiến trúc

```text
Internet
  -> Nginx 80/443
  -> Docker container ant-ai-service :8081
  -> External AI APIs: OpenAI, Qwen, Deepgram, MiniMax, Google TTS
```

`ai-service` hiện là NestJS service điều phối STT, LLM, TTS, realtime/audio-translate. Service không chạy model local, nên EC2 2 vCPU/16 GB RAM đủ cho dev, demo và pilot nhỏ.

## 1. Tạo EC2

Khuyến nghị:

| Setting | Giá trị |
| --- | --- |
| AMI | Amazon Linux 2023 |
| Instance type | `r7i.large` hoặc `r7g.large` |
| Storage | 30-50 GB gp3 |
| IAM Role | Có quyền pull ECR |
| Security Group | Chỉ mở 22 từ IP quản trị, 80/443 public |

Không mở trực tiếp port `8081` ra internet.

## 2. IAM cho EC2 pull ECR

Tạo IAM Role gắn vào EC2:

- Trusted entity: EC2
- Policy: `AmazonEC2ContainerRegistryReadOnly`

Khi EC2 có role này, deploy script có thể chạy `aws ecr get-login-password` mà không cần lưu AWS key trên máy.

## 3. Cài tool trên EC2

```bash
sudo dnf update -y
sudo dnf install -y docker awscli nginx htop curl

sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

sudo systemctl start nginx
sudo systemctl enable nginx
```

Logout SSH rồi login lại để group `docker` có hiệu lực.

## 4. Tạo env file cho ai-service

Deploy script mặc định đọc file:

```text
/home/ec2-user/ant-ai/env/ai-service.env
```

Tạo file:

```bash
mkdir -p /home/ec2-user/ant-ai/env

cat > /home/ec2-user/ant-ai/env/ai-service.env << 'EOF'
NODE_ENV=production
PORT=8081
LOG_LEVEL=info

# LLM
GEMINI_API_KEY=
GEMINI_LLM_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
OPENAI_LLM_MODEL=gpt-5.2
QWEN_API_KEY=
QWEN_LLM_MODEL=qwen-mt-flash
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# TTS
GOOGLE_TTS_API_KEY=
MINIMAX_API_KEY=
MINIMAX_TTS_MODEL=speech-02-hd
OPENAI_TTS_MODEL=tts-1

# STT
OPENAI_STT_MODEL=whisper-1
DEEPGRAM_API_KEY=
DEEPGRAM_STT_MODEL=nova-3

# Realtime
REALTIME_PROVIDER=openai
REALTIME_MODEL=gpt-4o-realtime-preview
GEMINI_REALTIME_MODEL=gemini-2.5-flash-native-audio-preview-12-2025

# Optional DB settings if enabled by future modules
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_DATABASE=ai_platform
EOF

chmod 600 /home/ec2-user/ant-ai/env/ai-service.env
```

Không commit file env thật vào git.

## 5. Tạo deploy script trên EC2

Nếu dùng workflow hiện tại, EC2 cần có file:

```text
/home/ec2-user/ant-ai/deploy-ai-service.sh
```

Ví dụ nội dung:

```bash
mkdir -p /home/ec2-user/ant-ai

cat > /home/ec2-user/ant-ai/deploy-ai-service.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-1}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
ECR_URL="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="$ECR_URL/ant-ai-service:$IMAGE_TAG"
ENV_FILE="/home/ec2-user/ant-ai/env/ai-service.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

echo "=== Login ECR ==="
aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "$ECR_URL"

echo "=== Pull image: $IMAGE ==="
docker pull "$IMAGE"

echo "=== Restart ant-ai-service ==="
echo "=== Using env file: $ENV_FILE ==="
docker stop ant-ai-service 2>/dev/null || true
docker rm ant-ai-service 2>/dev/null || true
docker run -d \
  --name ant-ai-service \
  --restart always \
  --network host \
  --env-file "$ENV_FILE" \
  -e PORT=8081 \
  "$IMAGE"

docker image prune -f
docker ps --filter name=ant-ai-service
EOF

chmod +x /home/ec2-user/ant-ai/deploy-ai-service.sh
```

Nếu muốn dùng script trong repo thay vì file tự tạo trên EC2, dùng:

```bash
mkdir -p /home/ec2-user/ant-ai/deploy/ec2
# copy deploy/ec2/deploy-app.sh và deploy/ec2/deploy-ai-service.sh lên thư mục này
```

Sau đó chạy:

```bash
AWS_REGION=ap-southeast-1 \
IMAGE_TAG=latest \
/home/ec2-user/ant-ai/deploy/ec2/deploy-ai-service.sh
```

## 6. GitHub Actions secrets

Workflow `.github/workflows/deploy-ai-service.yml` cần:

| Secret hoặc variable | Mục đích |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | Push image lên ECR từ GitHub Actions |
| `AWS_SECRET_ACCESS_KEY` | Push image lên ECR từ GitHub Actions |
| `AWS_ACCOUNT_ID` | Nên có nếu deploy script cần pull tag theo commit |
| `EC2_PROD_HOST` | Public IP hoặc DNS của EC2 |
| `EC2_PROD_SSH_KEY` | Private key SSH vào EC2 |
| `AWS_REGION` variable | Optional, mặc định `ap-southeast-1` |

EC2 nên dùng IAM Role để pull ECR. GitHub Actions dùng AWS key chỉ để build/push.

## 7. Nginx reverse proxy

Tạo file:

```bash
sudo tee /etc/nginx/conf.d/ai-service.conf << 'EOF'
upstream ant_ai_service {
    server 127.0.0.1:8081;
}

server {
    listen 80;
    server_name ai.example.com;

    client_max_body_size 50M;

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
        proxy_pass http://ant_ai_service;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /health {
        proxy_pass http://ant_ai_service/api/v1/health;
        access_log off;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx
```

Cài SSL sau khi DNS đã trỏ về Elastic IP:

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ai.example.com
sudo certbot renew --dry-run
```

## 8. Verify

Trên EC2:

```bash
docker ps --filter name=ant-ai-service
docker logs -f ant-ai-service
curl -s http://127.0.0.1:8081/api/v1/health
```

Từ internet:

```bash
curl -s https://ai.example.com/health
```

## 9. Restart, redeploy, rollback

Restart nhanh:

```bash
docker restart ant-ai-service
docker logs -f ant-ai-service
```

Sau khi đổi env phải recreate container:

```bash
/home/ec2-user/ant-ai/deploy-ai-service.sh
```

Rollback nếu image tag theo commit SHA:

```bash
docker stop ant-ai-service && docker rm ant-ai-service
docker run -d \
  --name ant-ai-service \
  --restart always \
  --network host \
  --env-file /home/ec2-user/ant-ai/env/ai-service.env \
  -e PORT=8081 \
  <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/ant-ai-service:<commit-sha>
```

## 10. Troubleshooting

Docker không pull được từ ECR:

```bash
aws sts get-caller-identity
aws ecr get-login-password --region ap-southeast-1 |
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com
```

Health check 404:

```bash
curl -i http://127.0.0.1:8081/api/v1/health
```

`ai-service` có global prefix `api/v1`, nên health endpoint nội bộ là `/api/v1/health`.

Container chạy nhưng API ngoài lỗi:

```bash
docker logs ant-ai-service --tail 200
docker exec ant-ai-service printenv | grep -E 'OPENAI|QWEN|DEEPGRAM|MINIMAX|GOOGLE'
```

Không in secret ra log công khai.
