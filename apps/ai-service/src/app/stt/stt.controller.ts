import { Controller, Post, Body } from '@nestjs/common';
import { SttService } from '@ai-platform/ai-core';

@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}

  @Post('transcribe')
  async transcribe(@Body() audioBuffer: Buffer): Promise<{ text: string }> {
    const text = await this.sttService.transcribeAudio(audioBuffer);
    return { text };
  }
}
