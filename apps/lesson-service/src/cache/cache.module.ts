import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackCache } from '../database/entities/feedback-cache.entity';
import { LessonCacheWarmerService } from './lesson-cache-warmer.service';
import { CachedFeedbackService } from './cached-feedback.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: 'memory',
        ttl: 86400,
        max: 50000,
        // In production, use Redis store:
        // store: redisStore,
        // host: config.get('REDIS_HOST', 'localhost'),
        // port: config.get('REDIS_PORT', 6379),
      }),
    }),
    TypeOrmModule.forFeature([FeedbackCache]),
  ],
  providers: [LessonCacheWarmerService, CachedFeedbackService],
  exports: [
    NestCacheModule,
    LessonCacheWarmerService,
    CachedFeedbackService,
  ],
})
export class AppCacheModule {}
