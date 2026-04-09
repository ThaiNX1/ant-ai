import { Module } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { SessionRouterService } from './session-router.service';

@Module({
  providers: [SessionManagerService, SessionRouterService],
  exports: [SessionManagerService, SessionRouterService],
})
export class SessionModule {}
