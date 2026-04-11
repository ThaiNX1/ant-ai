import { Controller, Inject, Post, Body, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ITtsAdapter, namedToken, } from '@ai-platform/ai-core';
import { SynthesizeDto } from './dto/synthesize.dto';

@Controller('tts')
export class TtsController {
  constructor(
    @Inject(namedToken('TTS', 'google-tts'))
    private readonly googleTts: ITtsAdapter,
  ) {}

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

    const stream = this.googleTts.streamSynthesize(
      dto.text,
      Object.keys(ttsOptions).length > 0 ? ttsOptions : undefined,
    );

    for await (const chunk of stream) {
      reply.raw.write(chunk);
    }

    reply.raw.end();
  }
}
