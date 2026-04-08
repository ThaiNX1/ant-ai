import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmConfigController } from './llm.config.controller';

@Module({
  controllers: [LlmController, LlmConfigController],
})
export class LlmModule {}
