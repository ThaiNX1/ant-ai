# ---- Voice Streaming Dockerfile ----
FROM python:3.11-slim

# Default AI_SERVICE_URL pointing to ai-service in private subnet
ENV AI_SERVICE_URL=http://ai-service:8081
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first for better layer caching
COPY apps/voice-streaming/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy voice-streaming application code
COPY apps/voice-streaming/ ./

# Create non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

# Expose UDP ports: RTP (5004) and Control (7000)
EXPOSE 5004/udp
EXPOSE 7000/udp

CMD ["python", "-m", "voice_streaming"]
