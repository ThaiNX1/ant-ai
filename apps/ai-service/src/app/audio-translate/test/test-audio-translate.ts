import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import axios from 'axios';

const AI_SERVICE_URL = 'http://localhost:8081/api/v1/audio-translate';

async function testAudioTranslate() {
  const audioPath = path.join(__dirname, 'test.mp3');
  const audioBuffer = fs.readFileSync(audioPath);

  console.log(`Audio file: ${audioPath}`);
  console.log(`Audio size: ${audioBuffer.length} bytes`);
  console.log('---');
  console.log('Sending: Vietnamese → Chinese');
  console.log('...');

  const form = new FormData();
  form.append('audio', audioBuffer, {
    filename: 'test.mp3',
    contentType: 'audio/mpeg',
  });
  form.append('sourceLanguage', 'vi');
  form.append('targetLanguage', 'zh');
  form.append('voiceId', 'nova');
  form.append('audioFormat', 'mp3');
  form.append('outputFormat', 'mp3');

  try {
    const startTime = Date.now();

    const response = await axios.post(AI_SERVICE_URL, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const elapsed = Date.now() - startTime;

    console.log(`✅ Success! (${elapsed}ms)`);
    console.log(`Original text: ${response.data.originalText}`);
    console.log(`Translated text: ${response.data.translatedText}`);
    console.log(`Audio content type: ${response.data.audioContentType}`);
    console.log(`Audio base64 length: ${response.data.audio.length} chars`);

    // Save output audio
    const outputBuffer = Buffer.from(response.data.audio, 'base64');
    const outputPath = path.join(__dirname, 'output-zh.mp3');
    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`Output saved: ${outputPath} (${outputBuffer.length} bytes)`);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`❌ Error: ${error.response.status} ${error.response.statusText}`);
        console.error(error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ Error: Connection refused — ai-service chưa chạy? (npm run serve:ai)');
      } else {
        console.error(`❌ Error: ${error.code} — ${error.message}`);
      }
    } else {
      console.error('❌ Error:', error);
    }
  }
}

testAudioTranslate();
