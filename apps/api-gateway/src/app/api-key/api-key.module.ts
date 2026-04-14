import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ApiKeyEntity } from './entities/api-key.entity';
import { ApiKeyRepository } from './api-key.repository';
import { ApiKeyCacheService } from './api-key-cache.service';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKeyEntity]),
    CacheModule.register({
      // Configure Redis store in app.module via CacheModule.registerAsync
    }),
  ],
  controllers: [ApiKeyController],
  providers: [ApiKeyRepository, ApiKeyCacheService, ApiKeyService],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
