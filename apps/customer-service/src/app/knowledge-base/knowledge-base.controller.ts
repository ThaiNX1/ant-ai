import { Controller, Post, Body } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { SearchDto } from './dto/search.dto';

@Controller('kb')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Post('search')
  async search(@Body() dto: SearchDto) {
    return this.knowledgeBaseService.search(dto);
  }
}
