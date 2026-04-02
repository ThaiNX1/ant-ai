import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  ObjectLiteral,
} from 'typeorm';

/**
 * Generic base repository providing common CRUD operations.
 * Concrete repositories extend this and add domain-specific queries.
 */
export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repo: Repository<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.repo.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repo.findOne(options);
  }

  async findBy(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repo.find({ where });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repo.find(options);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repo.create(data);
    return this.repo.save(entities);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repo.count({ where });
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    return this.repo.count({ where }).then((c) => c > 0);
  }

  /**
   * Insert or update. If a row matching `conflictColumns` exists, update it;
   * otherwise insert a new row. Returns the resulting entity.
   *
   * @param data - Entity data to insert or update
   * @param conflictColumns - Column(s) to check for conflicts (e.g. ['ssrc'], ['email'])
   */
  async upsert(
    data: DeepPartial<T>,
    conflictColumns: string[],
  ): Promise<T> {
    await this.repo.upsert(data as any, conflictColumns);
    // upsert doesn't return the entity, so we query it back
    const where = conflictColumns.reduce((acc, col) => {
      acc[col] = (data as any)[col];
      return acc;
    }, {} as Record<string, unknown>);
    const entity = await this.repo.findOne({
      where: where as FindOptionsWhere<T>,
    });
    return entity!;
  }
}
