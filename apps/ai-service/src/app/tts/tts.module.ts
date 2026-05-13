import { Module } from '@nestjs/common';
import { TtsController } from './tts.controller';
import { TtsStreamGateway } from './tts-stream.gateway';

@Module({
  controllers: [TtsController],
  providers: [TtsStreamGateway],
})
export class TtsModule {}
