import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createKeyv } from '@keyv/redis';
import { ApiKeyModule } from './api-key/api-key.module';
import { ApiKeyEntity } from './api-key/entities/api-key.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env['LOG_LEVEL'] || 'info',
      } as object,
    }),

    // Redis cache — no TTL (keys live until explicitly deleted)
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get('REDIS_HOST', 'localhost');
        const port = config.get<number>('REDIS_PORT', 6379);
        const password = config.get('REDIS_PASSWORD', '');
        const url = password
          ? `redis://:${password}@${host}:${port}`
          : `redis://${host}:${port}`;
        return { stores: [createKeyv(url)] };
      },
    }),

    // PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'api_gateway'),
        entities: [ApiKeyEntity],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),

    ApiKeyModule,
  ],
})
export class AppModule {}
