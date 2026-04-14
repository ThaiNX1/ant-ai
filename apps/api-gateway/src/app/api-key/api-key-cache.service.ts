import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiKeyEntity } from './entities/api-key.entity';

export interface CachedApiKey {
  id: string;
  userId: string;
  services: string[];
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null; // ISO string
}

const CACHE_PREFIX = 'apikey:';

/**
 * Redis cache layer for API keys.
 * No TTL — entries live forever until explicitly invalidated on update/delete.
 */
@Injectable()
export class ApiKeyCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private key(keyHash: string): string {
    return `${CACHE_PREFIX}${keyHash}`;
  }

  async get(keyHash: string): Promise<CachedApiKey | null> {
    return this.cache.get<CachedApiKey>(this.key(keyHash)) ?? null;
  }

  async set(keyHash: string, entity: ApiKeyEntity): Promise<void> {
    const payload: CachedApiKey = {
      id: entity.id,
      userId: entity.userId,
      services: entity.services,
      scopes: entity.scopes,
      isActive: entity.isActive,
      expiresAt: entity.expiresAt?.toISOString() ?? null,
    };
    // No TTL — persists until invalidated
    await this.cache.set(this.key(keyHash), payload, 0);
  }

  async invalidate(keyHash: string): Promise<void> {
    await this.cache.del(this.key(keyHash));
  }
}
