import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../database/entities/lesson.entity';
import { LessonStep } from '../database/entities/lesson-step.entity';
import { Student } from '../database/entities/student.entity';
import { LessonProgress } from '../database/entities/lesson-progress.entity';
import { StepAttempt } from '../database/entities/step-attempt.entity';
import { Enrollment } from '../database/entities/enrollment.entity';
import { LessonSession } from './models/lesson-session.interface';

@Injectable()
export class LessonLoaderService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonStep)
    private readonly stepRepo: Repository<LessonStep>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
    @InjectRepository(StepAttempt)
    private readonly attemptRepo: Repository<StepAttempt>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async loadLessonSession(
    studentId: string,
    lessonId: string,
  ): Promise<LessonSession> {
    const student = await this.studentRepo.findOneBy({ id: studentId });
    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const lesson = await this.lessonRepo.findOneBy({ id: lessonId });
    if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);

    const steps = await this.stepRepo.find({
      where: { lessonId },
      order: { stepIndex: 'ASC' },
    });

    const enrollment = await this.enrollmentRepo.findOne({
      where: { studentId, courseId: lesson.courseId, status: 'active' },
    });
    if (!enrollment) {
      throw new NotFoundException(
        `No active enrollment for student ${studentId} in course ${lesson.courseId}`,
      );
    }

    let progress = await this.progressRepo.findOne({
      where: { studentId, lessonId },
      order: { createdAt: 'DESC' },
    });

    if (!progress) {
      progress = this.progressRepo.create({
        studentId,
        lessonId,
        enrollmentId: enrollment.id,
        totalSteps: steps.length,
        status: 'in_progress',
        startedAt: new Date(),
      });
      progress = await this.progressRepo.save(progress);
    }

    const pastAttempts = await this.attemptRepo.find({
      where: { lessonProgressId: progress.id },
      order: { stepIndex: 'ASC', attemptNumber: 'ASC' },
    });

    return { lesson, steps, student, progress, pastAttempts };
  }

  async getResumeInfo(
    studentId: string,
  ): Promise<LessonProgress | null> {
    return this.progressRepo.findOne({
      where: [
        { studentId, status: 'in_progress' },
        { studentId, status: 'paused' },
      ],
      order: { updatedAt: 'DESC' },
      relations: ['lesson'],
    });
  }

  async getNextLesson(studentId: string): Promise<Lesson | null> {
    // Find the latest completed lesson for this student
    const lastCompleted = await this.progressRepo.findOne({
      where: { studentId, status: 'completed' },
      order: { completedAt: 'DESC' },
      relations: ['lesson'],
    });

    if (!lastCompleted) {
      // No completed lessons — find the first lesson in any active enrollment
      const enrollment = await this.enrollmentRepo.findOne({
        where: { studentId, status: 'active' },
      });
      if (!enrollment) return null;

      return this.lessonRepo.findOne({
        where: { courseId: enrollment.courseId, status: 'published' },
        order: { orderIndex: 'ASC' },
      });
    }

    // Find the next lesson in the same course
    return this.lessonRepo.findOne({
      where: {
        courseId: lastCompleted.lesson.courseId,
        status: 'published',
      },
      order: { orderIndex: 'ASC' },
    });
  }
}
