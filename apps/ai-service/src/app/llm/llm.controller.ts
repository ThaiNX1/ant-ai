import { Controller, Inject, Post, Body, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GenerateDto } from './dto/generate.dto';
import { namedToken, ILlmAdapter } from '@ai-platform/ai-core';

interface MessageEvent {
  data: string;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('llm')
export class LlmController {
  constructor(
    @Inject(namedToken('LLM', 'gemini-flash'))
    private readonly geminiFlash: ILlmAdapter,
  ) {}

  @Post('generate')
  async generate(@Body() dto: GenerateDto): Promise<{ result: string }> {
    const result = await this.geminiFlash.generate(dto.prompt, dto.options);
    return { result };
  }

  @Post('generate-stream')
  @Sse()
  generateStream(@Body() dto: GenerateDto): Observable<MessageEvent> {
    const stream = this.geminiFlash.generateStream(dto.prompt, dto.options);
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          for await (const chunk of stream) {
            subscriber.next({ data: chunk });
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }
}
