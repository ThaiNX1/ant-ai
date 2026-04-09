import { Module } from '@nestjs/common';
import { FreeTalkService } from './free-talk.service';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [ProgressModule],
  providers: [FreeTalkService],
  exports: [FreeTalkService],
})
export class FreeTalkModule {}
