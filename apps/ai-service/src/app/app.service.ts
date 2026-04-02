import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): { service: string; status: string } {
    return { service: 'ai-service', status: 'ok' };
  }
}
