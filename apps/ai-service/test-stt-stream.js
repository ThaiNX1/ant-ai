/**
 * Test script for STT stream gateway.
 * 
 * Usage:
 *   1. Place a WAV/MP3 file as test-audio.mp3 in this directory
 *   2. Run: node test-stt-stream.js
 *   
 *   Or generate a PCM test file first:
 *     ffmpeg -i your-audio.mp3 -f s16le -acodec pcm_s16le -ar 16000 -ac 1 test-audio.pcm
 *     node test-stt-stream.js test-audio.pcm
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const WS_URL = 'ws://localhost:8081/stt-stream?provider=deepgram';
const CHUNK_SIZE = 640; // 320 samples × 2 bytes = 20ms at 16kHz
const CHUNK_INTERVAL_MS = 20;

const audioFile = process.argv[2] || 'test-audio.pcm';

if (!fs.existsSync(audioFile)) {
  console.log(`Audio file not found: ${audioFile}`);
  console.log('');
  console.log('Generate a test PCM file:');
  console.log('  ffmpeg -i your-audio.mp3 -f s16le -acodec pcm_s16le -ar 16000 -ac 1 test-audio.pcm');
  console.log('');
  console.log('Or generate silence (2 seconds):');
  
  // Generate 2 seconds of silence as test
  const silenceDuration = 2; // seconds
  const sampleRate = 16000;
  const silence = Buffer.alloc(sampleRate * 2 * silenceDuration); // 16-bit = 2 bytes/sample
  
  // Add a simple tone so Deepgram has something to process
  for (let i = 0; i < sampleRate * silenceDuration; i++) {
    const value = Math.floor(Math.sin(2 * Math.PI * 440 * i / sampleRate) * 3000);
    silence.writeInt16LE(value, i * 2);
  }
  
  fs.writeFileSync('test-tone.pcm', silence);
  console.log('  Generated test-tone.pcm (2s 440Hz tone)');
  console.log('  Run: node test-stt-stream.js test-tone.pcm');
  process.exit(0);
}

const audioData = fs.readFileSync(audioFile);
console.log(`Loaded ${audioFile}: ${audioData.length} bytes (${(audioData.length / 32000).toFixed(1)}s at 16kHz)`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connected to gateway');
  
  // Send start event
  const startMsg = JSON.stringify({
    event: 'start',
    data: { language: 'vi', model: 'nova-3' }
  });
  ws.send(startMsg);
  console.log('Sent start event');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  if (msg.event === 'ready') {
    console.log('Gateway ready — sending audio chunks...');
    sendAudioChunks();
  } else if (msg.event === 'transcript') {
    const t = msg.data;
    console.log(`[${t.type}] "${t.transcript}" (confidence: ${t.confidence})`);
  } else if (msg.event === 'error') {
    console.error('Error:', msg.data.message);
  } else if (msg.event === 'done') {
    console.log('Done');
    ws.close();
  } else {
    console.log('Event:', msg);
  }
});

ws.on('error', (err) => {
  console.error('WS error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`WS closed: code=${code} reason=${reason}`);
  process.exit(0);
});

function sendAudioChunks() {
  let offset = 0;
  
  const interval = setInterval(() => {
    if (offset >= audioData.length) {
      clearInterval(interval);
      console.log('All audio sent — waiting for final transcript...');
      
      // Send stop after a short delay to let Deepgram process
      setTimeout(() => {
        ws.send(JSON.stringify({ event: 'stop' }));
      }, 3000);
      return;
    }
    
    const chunk = audioData.slice(offset, offset + CHUNK_SIZE);
    ws.send(chunk);
    offset += CHUNK_SIZE;
  }, CHUNK_INTERVAL_MS);
}
