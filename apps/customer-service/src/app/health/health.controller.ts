import { Controller, Get } from '@nestjs/common';

@Controller('cs')
export class HealthController {
  @Get('health')
  check() {
    return {
      status: 'ok',
      service: 'customer-service',
      timestamp: new Date().toISOString(),
    };
  }
}
