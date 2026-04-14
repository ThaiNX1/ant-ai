import { Controller, Inject, Post, Body, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ITtsAdapter, namedToken, } from '@ai-platform/ai-core';
import { SynthesizeDto } from './dto/synthesize.dto';

@Controller('tts')
export class TtsController {
  constructor(
    @Inject(namedToken('TTS', 'google-tts'))
    private readonly googleTts: ITtsAdapter,
    @Inject(namedToken('TTS', 'minimax'))
    private readonly minimaxTts: ITtsAdapter,
  ) {}

  @Post('synthesize-stream')
  async synthesizeStream(
    @Body() dto: SynthesizeDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await this.streamReply(this.googleTts, dto, reply);
  }

  @Post('minimax/synthesize')
  async minimaxSynthesize(@Body() dto: SynthesizeDto): Promise<{ audio: string }> {
    const audio = await this.minimaxTts.synthesize(dto.text, this.buildOptions(dto));
    return { audio: audio.toString('base64') };
  }

  @Post('minimax/synthesize-stream')
  async minimaxSynthesizeStream(
    @Body() dto: SynthesizeDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    await this.streamReply(this.minimaxTts, dto, reply);
  }

  private async streamReply(
    adapter: ITtsAdapter,
    dto: SynthesizeDto,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      for await (const chunk of adapter.streamSynthesize(dto.text, this.buildOptions(dto))) {
        if (!reply.raw.headersSent) {
          reply.raw.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked',
          });
        }
        reply.raw.write(chunk);
      }
      reply.raw.end();
    } catch (error: unknown) {
      if (reply.raw.headersSent) {
        // Headers already sent — can't send error response, just close connection
        reply.raw.end();
      } else {
        throw error; // Let GlobalExceptionFilter handle it normally
      }
    }
  }

  private buildOptions(dto: SynthesizeDto) {
    const opts = { ...(dto.options ?? {}), ...(dto.voiceId ? { voiceId: dto.voiceId } : {}) };
    return Object.keys(opts).length > 0 ? opts : undefined;
  }
}
