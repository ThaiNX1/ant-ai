import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('GET /cs/health', () => {
    it('should return status ok with service name customer-service', () => {
      const result = controller.check();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('customer-service');
    });

    it('should return a valid ISO timestamp', () => {
      const before = new Date().toISOString();
      const result = controller.check();
      const after = new Date().toISOString();

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it('should return an object with exactly three keys', () => {
      const result = controller.check();

      expect(Object.keys(result)).toEqual(['status', 'service', 'timestamp']);
    });
  });
});
