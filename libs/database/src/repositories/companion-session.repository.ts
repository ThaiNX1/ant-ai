import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanionSession } from '../entities/companion-session.entity';

@Injectable()
export class CompanionSessionRepository {
  constructor(
    @InjectRepository(CompanionSession)
    private readonly repo: Repository<CompanionSession>,
  ) {}

  async findById(id: string): Promise<CompanionSession | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByStudentId(studentId: string): Promise<CompanionSession[]> {
    return this.repo.find({ where: { studentId } });
  }

  async findActive(studentId: string): Promise<CompanionSession | null> {
    return this.repo.findOne({
      where: { studentId, endedAt: undefined },
    });
  }

  async findAll(): Promise<CompanionSession[]> {
    return this.repo.find();
  }

  async create(data: Partial<CompanionSession>): Promise<CompanionSession> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<CompanionSession>,
  ): Promise<CompanionSession | null> {
    await this.repo.update(id, data as Record<string, unknown>);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
