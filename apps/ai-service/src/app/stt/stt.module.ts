import { Module } from '@nestjs/common';
import { SttController } from './stt.controller';
import { SttStreamGateway } from './stt-stream.gateway';

@Module({
  controllers: [SttController],
  providers: [SttStreamGateway],
})
export class SttModule {}
