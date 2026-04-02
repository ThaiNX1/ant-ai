import { Controller, Post, Body, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LlmService } from '@ai-platform/ai-core';
import { GenerateDto } from './dto/generate.dto';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateDto): Promise<{ result: string }> {
    const result = await this.llmService.generate(dto.prompt, dto.options);
    return { result };
  }

  @Post('generate-stream')
  @Sse()
  generateStream(@Body() dto: GenerateDto): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          const stream = this.llmService.generateStream(dto.prompt, dto.options);
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
