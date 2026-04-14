import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ApiKeyRepository } from './api-key.repository';
import { ApiKeyCacheService, CachedApiKey } from './api-key-cache.service';
import { ApiKeyEntity } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

export interface GeneratedApiKey {
  raw: string;       // Shown ONCE to user — never stored
  prefix: string;    // Stored for display
  entity: ApiKeyEntity;
}

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly repo: ApiKeyRepository,
    private readonly cache: ApiKeyCacheService,
  ) {}

  // ---------------------------------------------------------------------------
  // Generate & Create
  // ---------------------------------------------------------------------------
  async create(dto: CreateApiKeyDto): Promise<GeneratedApiKey> {
    const raw = `ant_${randomBytes(32).toString('hex')}`; // 69-char key
    const keyHash = this.hash(raw);
    const keyPrefix = raw.slice(0, 12);

    const entity = await this.repo.create({
      keyHash,
      keyPrefix,
      userId: dto.userId,
      name: dto.name,
      services: dto.services,
      scopes: dto.scopes,
      isActive: true,
      expiresAt: dto.expiresAt ?? null,
    });

    // Warm cache immediately
    await this.cache.set(keyHash, entity);

    return { raw, prefix: keyPrefix, entity };
  }

  // ---------------------------------------------------------------------------
  // Validate — called on every request (Redis first, DB fallback)
  // ---------------------------------------------------------------------------
  async validate(rawKey: string): Promise<CachedApiKey | null> {
    const keyHash = this.hash(rawKey);

    // 1. Redis cache hit
    const cached = await this.cache.get(keyHash);
    if (cached) return this.isValid(cached) ? cached : null;

    // 2. Cache miss → DB lookup
    const entity = await this.repo.findByKeyHash(keyHash);
    if (!entity) return null;

    // 3. Warm cache for next request
    await this.cache.set(keyHash, entity);

    const payload: CachedApiKey = {
      id: entity.id,
      userId: entity.userId,
      services: entity.services,
      scopes: entity.scopes,
      isActive: entity.isActive,
      expiresAt: entity.expiresAt?.toISOString() ?? null,
    };
    return this.isValid(payload) ? payload : null;
  }

  // ---------------------------------------------------------------------------
  // Update — sync DB then invalidate cache (next request re-warms from DB)
  // ---------------------------------------------------------------------------
  async update(id: string, dto: UpdateApiKeyDto): Promise<ApiKeyEntity> {
    const entity = await this.repo.update(id, dto);
    if (!entity) throw new NotFoundException(`API key ${id} not found`);

    // Invalidate cache → next validate() call will re-warm from DB
    await this.cache.invalidate(entity.keyHash);

    return entity;
  }

  async revoke(id: string): Promise<void> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundException(`API key ${id} not found`);

    await this.repo.update(id, { isActive: false });
    await this.cache.invalidate(entity.keyHash);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundException(`API key ${id} not found`);

    await this.repo.delete(id);
    await this.cache.invalidate(entity.keyHash);
  }

  async findByUser(userId: string): Promise<ApiKeyEntity[]> {
    return this.repo.findBy({ userId });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private isValid(key: CachedApiKey): boolean {
    if (!key.isActive) return false;
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return false;
    return true;
  }
}
