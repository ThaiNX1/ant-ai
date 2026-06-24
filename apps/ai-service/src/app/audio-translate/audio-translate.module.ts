import { Module } from '@nestjs/common';
import { AudioTranslateController } from './audio-translate.controller';
import { AudioTranslateService } from './audio-translate.service';

@Module({
  controllers: [AudioTranslateController],
  providers: [AudioTranslateService],
})
export class AudioTranslateModule {}
