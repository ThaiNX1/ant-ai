import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningSession } from '../entities/learning-session.entity';

@Injectable()
export class LearningSessionRepository {
  constructor(
    @InjectRepository(LearningSession)
    private readonly repo: Repository<LearningSession>,
  ) {}

  async findById(id: string): Promise<LearningSession | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByStudentId(studentId: string): Promise<LearningSession[]> {
    return this.repo.find({ where: { studentId } });
  }

  async findByLessonId(lessonId: string): Promise<LearningSession[]> {
    return this.repo.find({ where: { lessonId } });
  }

  async findActive(studentId: string): Promise<LearningSession | null> {
    return this.repo.findOne({
      where: { studentId, status: 'active' },
    });
  }

  async findAll(): Promise<LearningSession[]> {
    return this.repo.find();
  }

  async create(data: Partial<LearningSession>): Promise<LearningSession> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<LearningSession>,
  ): Promise<LearningSession | null> {
    await this.repo.update(id, data as Record<string, unknown>);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
