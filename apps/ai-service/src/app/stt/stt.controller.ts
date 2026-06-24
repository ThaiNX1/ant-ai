import { Controller, Inject, Post, Body } from '@nestjs/common';
import { ISttAdapter, namedToken, SttTranscriptionResult } from '@ai-platform/ai-core';

@Controller('stt')
export class SttController {
  constructor(
    @Inject(namedToken('STT', 'openai-whisper'))
    private readonly whisper: ISttAdapter,
  ) {}

  @Post('transcribe')
  async transcribe(@Body() audioBuffer: Buffer): Promise<SttTranscriptionResult> {
    return this.whisper.transcribeAudio(audioBuffer);
  }
}
