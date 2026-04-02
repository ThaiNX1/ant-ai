import { Controller, Inject, Post, Body } from '@nestjs/common';
import { ISttAdapter, namedToken } from '@ai-platform/ai-core';

@Controller('stt')
export class SttController {
  constructor(
    @Inject(namedToken('STT', 'openai-whisper'))
    private readonly whisper: ISttAdapter,
  ) {}

  @Post('transcribe')
  async transcribe(@Body() audioBuffer: Buffer): Promise<{ text: string }> {
    const text = await this.whisper.transcribeAudio(audioBuffer);
    return { text };
  }
}
