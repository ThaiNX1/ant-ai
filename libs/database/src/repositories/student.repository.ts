import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(Student)
    private readonly repo: Repository<Student>,
  ) {}

  async findById(id: string): Promise<Student | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySsrc(ssrc: string): Promise<Student | null> {
    return this.repo.findOne({ where: { ssrc } });
  }

  async findAll(): Promise<Student[]> {
    return this.repo.find();
  }

  async create(data: Partial<Student>): Promise<Student> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Student>): Promise<Student | null> {
    await this.repo.update(id, data as Record<string, unknown>);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
