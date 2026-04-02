import { Injectable } from '@nestjs/common';
import { StudentRepository } from './repositories/student.repository';
import { LessonRepository } from './repositories/lesson.repository';
import { LearningSessionRepository } from './repositories/learning-session.repository';
import { CompanionSessionRepository } from './repositories/companion-session.repository';
import { Student } from './entities/student.entity';
import { Lesson } from './entities/lesson.entity';
import { LearningSession } from './entities/learning-session.entity';
import { CompanionSession } from './entities/companion-session.entity';

@Injectable()
export class DatabaseService {
  constructor(
    private readonly studentRepo: StudentRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly learningSessionRepo: LearningSessionRepository,
    private readonly companionSessionRepo: CompanionSessionRepository,
  ) {}

  // --- Student CRUD ---

  async createStudent(data: Partial<Student>): Promise<Student> {
    return this.studentRepo.create(data);
  }

  async getStudentById(id: string): Promise<Student | null> {
    return this.studentRepo.findById(id);
  }

  async getStudentBySsrc(ssrc: string): Promise<Student | null> {
    return this.studentRepo.findBySsrc(ssrc);
  }

  async updateStudent(
    id: string,
    data: Partial<Student>,
  ): Promise<Student | null> {
    return this.studentRepo.update(id, data);
  }

  async deleteStudent(id: string): Promise<void> {
    return this.studentRepo.delete(id);
  }

  // --- Lesson CRUD ---

  async createLesson(data: Partial<Lesson>): Promise<Lesson> {
    return this.lessonRepo.create(data);
  }

  async getLessonById(id: string): Promise<Lesson | null> {
    return this.lessonRepo.findById(id);
  }

  async getLessonsByType(type: string): Promise<Lesson[]> {
    return this.lessonRepo.findByType(type);
  }

  async updateLesson(
    id: string,
    data: Partial<Lesson>,
  ): Promise<Lesson | null> {
    return this.lessonRepo.update(id, data);
  }

  async deleteLesson(id: string): Promise<void> {
    return this.lessonRepo.delete(id);
  }

  // --- LearningSession CRUD ---

  async createLearningSession(
    data: Partial<LearningSession>,
  ): Promise<LearningSession> {
    return this.learningSessionRepo.create(data);
  }

  async getLearningSessionById(
    id: string,
  ): Promise<LearningSession | null> {
    return this.learningSessionRepo.findById(id);
  }

  async getActiveLearningSession(
    studentId: string,
  ): Promise<LearningSession | null> {
    return this.learningSessionRepo.findActive(studentId);
  }

  async updateLearningSession(
    id: string,
    data: Partial<LearningSession>,
  ): Promise<LearningSession | null> {
    return this.learningSessionRepo.update(id, data);
  }

  async deleteLearningSession(id: string): Promise<void> {
    return this.learningSessionRepo.delete(id);
  }

  // --- CompanionSession CRUD ---

  async createCompanionSession(
    data: Partial<CompanionSession>,
  ): Promise<CompanionSession> {
    return this.companionSessionRepo.create(data);
  }

  async getCompanionSessionById(
    id: string,
  ): Promise<CompanionSession | null> {
    return this.companionSessionRepo.findById(id);
  }

  async getActiveCompanionSession(
    studentId: string,
  ): Promise<CompanionSession | null> {
    return this.companionSessionRepo.findActive(studentId);
  }

  async updateCompanionSession(
    id: string,
    data: Partial<CompanionSession>,
  ): Promise<CompanionSession | null> {
    return this.companionSessionRepo.update(id, data);
  }

  async deleteCompanionSession(id: string): Promise<void> {
    return this.companionSessionRepo.delete(id);
  }

  // --- Bundle / Ensure operations ---

  async ensureStudent(data: Partial<Student>): Promise<Student> {
    if (data.ssrc) {
      const existing = await this.studentRepo.findBySsrc(data.ssrc);
      if (existing) {
        return existing;
      }
    }
    return this.studentRepo.create(data);
  }

  async loadLessonBundle(
    lessonId: string,
  ): Promise<{ lesson: Lesson; sessions: LearningSession[] } | null> {
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) {
      return null;
    }
    const sessions =
      await this.learningSessionRepo.findByLessonId(lessonId);
    return { lesson, sessions };
  }

  async loadStudentBundle(
    studentId: string,
  ): Promise<{
    student: Student;
    learningSessions: LearningSession[];
    companionSessions: CompanionSession[];
  } | null> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) {
      return null;
    }
    const learningSessions =
      await this.learningSessionRepo.findByStudentId(studentId);
    const companionSessions =
      await this.companionSessionRepo.findByStudentId(studentId);
    return { student, learningSessions, companionSessions };
  }
}
