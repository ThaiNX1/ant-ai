import { Controller, Post, Body, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { TtsService } from '@ai-platform/ai-core';
import { SynthesizeDto } from './dto/synthesize.dto';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post('synthesize-stream')
  async synthesizeStream(
    @Body() dto: SynthesizeDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    reply.raw.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
    });

    const ttsOptions = {
      ...(dto.options || {}),
      ...(dto.voiceId ? { voiceId: dto.voiceId } : {}),
    };

    const stream = this.ttsService.streamSynthesize(
      dto.text,
      Object.keys(ttsOptions).length > 0 ? ttsOptions : undefined,
    );

    for await (const chunk of stream) {
      reply.raw.write(chunk);
    }

    reply.raw.end();
  }
}
