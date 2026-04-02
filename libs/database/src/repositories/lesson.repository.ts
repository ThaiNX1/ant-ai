import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../entities/lesson.entity';

@Injectable()
export class LessonRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly repo: Repository<Lesson>,
  ) {}

  async findById(id: string): Promise<Lesson | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByType(type: string): Promise<Lesson[]> {
    return this.repo.find({ where: { type } });
  }

  async findAll(): Promise<Lesson[]> {
    return this.repo.find();
  }

  async create(data: Partial<Lesson>): Promise<Lesson> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
    await this.repo.update(id, data as Record<string, unknown>);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
