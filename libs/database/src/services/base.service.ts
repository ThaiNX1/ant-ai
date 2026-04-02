import { DeepPartial, FindManyOptions, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseRepository } from '../repositories/base.repository';

/**
 * Generic base service wrapping a BaseRepository.
 * Provides a clean service-layer API for common CRUD.
 * Concrete services extend this and add domain-specific logic.
 */
export abstract class BaseService<T extends ObjectLiteral> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  async getById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async getAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.findAll(options);
  }

  async getBy(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.findBy(where);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    return this.repository.create(data);
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    return this.repository.createMany(data);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count(where);
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    return this.repository.exists(where);
  }

  /**
   * Insert or update based on conflict columns.
   */
  async upsert(data: DeepPartial<T>, conflictColumns: string[]): Promise<T> {
    return this.repository.upsert(data, conflictColumns);
  }
}
