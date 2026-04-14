import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@ai-platform/database';
import { ApiKeyEntity } from './entities/api-key.entity';

@Injectable()
export class ApiKeyRepository extends BaseRepository<ApiKeyEntity> {
  constructor(
    @InjectRepository(ApiKeyEntity)
    repo: Repository<ApiKeyEntity>,
  ) {
    super(repo);
  }

  async findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null> {
    return this.repo.findOne({ where: { keyHash, isActive: true } });
  }
}
