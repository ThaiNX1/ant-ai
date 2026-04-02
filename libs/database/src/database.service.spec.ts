import { DatabaseService } from './database.service';
import { StudentRepository } from './repositories/student.repository';
import { LessonRepository } from './repositories/lesson.repository';
import { LearningSessionRepository } from './repositories/learning-session.repository';
import { CompanionSessionRepository } from './repositories/companion-session.repository';
import { Student } from './entities/student.entity';
import { Lesson } from './entities/lesson.entity';
import { LearningSession } from './entities/learning-session.entity';
import { CompanionSession } from './entities/companion-session.entity';

function createMockRepo<T>() {
  return {
    findById: jest.fn(),
    findBySsrc: jest.fn(),
    findByType: jest.fn(),
    findByStudentId: jest.fn(),
    findByLessonId: jest.fn(),
    findActive: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('DatabaseService', () => {
  let service: DatabaseService;
  let studentRepo: ReturnType<typeof createMockRepo>;
  let lessonRepo: ReturnType<typeof createMockRepo>;
  let learningSessionRepo: ReturnType<typeof createMockRepo>;
  let companionSessionRepo: ReturnType<typeof createMockRepo>;

  beforeEach(() => {
    studentRepo = createMockRepo();
    lessonRepo = createMockRepo();
    learningSessionRepo = createMockRepo();
    companionSessionRepo = createMockRepo();

    service = new DatabaseService(
      studentRepo as unknown as StudentRepository,
      lessonRepo as unknown as LessonRepository,
      learningSessionRepo as unknown as LearningSessionRepository,
      companionSessionRepo as unknown as CompanionSessionRepository,
    );
  });

  // --- Student ---
  describe('Student CRUD', () => {
    const mockStudent = {
      id: 'uuid-1',
      name: 'Test',
      ssrc: '1234',
      accountId: 'acc-1',
      deviceId: 'dev-1',
    } as Student;

    it('createStudent delegates to repo', async () => {
      studentRepo.create.mockResolvedValue(mockStudent);
      const result = await service.createStudent({ name: 'Test' });
      expect(result).toBe(mockStudent);
      expect(studentRepo.create).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('getStudentById delegates to repo', async () => {
      studentRepo.findById.mockResolvedValue(mockStudent);
      const result = await service.getStudentById('uuid-1');
      expect(result).toBe(mockStudent);
    });

    it('getStudentBySsrc delegates to repo', async () => {
      studentRepo.findBySsrc.mockResolvedValue(mockStudent);
      const result = await service.getStudentBySsrc('1234');
      expect(result).toBe(mockStudent);
    });

    it('updateStudent delegates to repo', async () => {
      studentRepo.update.mockResolvedValue(mockStudent);
      const result = await service.updateStudent('uuid-1', { name: 'Updated' });
      expect(result).toBe(mockStudent);
    });

    it('deleteStudent delegates to repo', async () => {
      studentRepo.delete.mockResolvedValue(undefined);
      await service.deleteStudent('uuid-1');
      expect(studentRepo.delete).toHaveBeenCalledWith('uuid-1');
    });
  });

  // --- Lesson ---
  describe('Lesson CRUD', () => {
    const mockLesson = {
      id: 'uuid-2',
      title: 'Lesson 1',
      type: 'grammar',
      content: {},
    } as Lesson;

    it('createLesson delegates to repo', async () => {
      lessonRepo.create.mockResolvedValue(mockLesson);
      const result = await service.createLesson({ title: 'Lesson 1' });
      expect(result).toBe(mockLesson);
    });

    it('getLessonById delegates to repo', async () => {
      lessonRepo.findById.mockResolvedValue(mockLesson);
      const result = await service.getLessonById('uuid-2');
      expect(result).toBe(mockLesson);
    });

    it('getLessonsByType delegates to repo', async () => {
      lessonRepo.findByType.mockResolvedValue([mockLesson]);
      const result = await service.getLessonsByType('grammar');
      expect(result).toEqual([mockLesson]);
    });

    it('deleteLesson delegates to repo', async () => {
      lessonRepo.delete.mockResolvedValue(undefined);
      await service.deleteLesson('uuid-2');
      expect(lessonRepo.delete).toHaveBeenCalledWith('uuid-2');
    });
  });

  // --- LearningSession ---
  describe('LearningSession CRUD', () => {
    const mockSession = {
      id: 'uuid-3',
      studentId: 'uuid-1',
      lessonId: 'uuid-2',
      status: 'active',
    } as LearningSession;

    it('createLearningSession delegates to repo', async () => {
      learningSessionRepo.create.mockResolvedValue(mockSession);
      const result = await service.createLearningSession({
        studentId: 'uuid-1',
      });
      expect(result).toBe(mockSession);
    });

    it('getActiveLearningSession delegates to repo', async () => {
      learningSessionRepo.findActive.mockResolvedValue(mockSession);
      const result = await service.getActiveLearningSession('uuid-1');
      expect(result).toBe(mockSession);
    });
  });

  // --- CompanionSession ---
  describe('CompanionSession CRUD', () => {
    const mockSession = {
      id: 'uuid-4',
      studentId: 'uuid-1',
      mode: 'chat',
    } as CompanionSession;

    it('createCompanionSession delegates to repo', async () => {
      companionSessionRepo.create.mockResolvedValue(mockSession);
      const result = await service.createCompanionSession({
        studentId: 'uuid-1',
      });
      expect(result).toBe(mockSession);
    });

    it('getActiveCompanionSession delegates to repo', async () => {
      companionSessionRepo.findActive.mockResolvedValue(mockSession);
      const result = await service.getActiveCompanionSession('uuid-1');
      expect(result).toBe(mockSession);
    });
  });

  // --- Bundle / Ensure ---
  describe('ensureStudent', () => {
    it('returns existing student if ssrc matches', async () => {
      const existing = { id: 'uuid-1', ssrc: '1234' } as Student;
      studentRepo.findBySsrc.mockResolvedValue(existing);
      const result = await service.ensureStudent({ ssrc: '1234', name: 'New' });
      expect(result).toBe(existing);
      expect(studentRepo.create).not.toHaveBeenCalled();
    });

    it('creates new student if ssrc not found', async () => {
      const created = { id: 'uuid-new', ssrc: '5678' } as Student;
      studentRepo.findBySsrc.mockResolvedValue(null);
      studentRepo.create.mockResolvedValue(created);
      const result = await service.ensureStudent({ ssrc: '5678', name: 'New' });
      expect(result).toBe(created);
    });

    it('creates new student if no ssrc provided', async () => {
      const created = { id: 'uuid-new' } as Student;
      studentRepo.create.mockResolvedValue(created);
      const result = await service.ensureStudent({ name: 'NoSsrc' });
      expect(result).toBe(created);
      expect(studentRepo.findBySsrc).not.toHaveBeenCalled();
    });
  });

  describe('loadLessonBundle', () => {
    it('returns lesson and sessions', async () => {
      const lesson = { id: 'uuid-2' } as Lesson;
      const sessions = [{ id: 'uuid-3' }] as LearningSession[];
      lessonRepo.findById.mockResolvedValue(lesson);
      learningSessionRepo.findByLessonId.mockResolvedValue(sessions);
      const result = await service.loadLessonBundle('uuid-2');
      expect(result).toEqual({ lesson, sessions });
    });

    it('returns null if lesson not found', async () => {
      lessonRepo.findById.mockResolvedValue(null);
      const result = await service.loadLessonBundle('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('loadStudentBundle', () => {
    it('returns student with all sessions', async () => {
      const student = { id: 'uuid-1' } as Student;
      const ls = [{ id: 'ls-1' }] as LearningSession[];
      const cs = [{ id: 'cs-1' }] as CompanionSession[];
      studentRepo.findById.mockResolvedValue(student);
      learningSessionRepo.findByStudentId.mockResolvedValue(ls);
      companionSessionRepo.findByStudentId.mockResolvedValue(cs);
      const result = await service.loadStudentBundle('uuid-1');
      expect(result).toEqual({
        student,
        learningSessions: ls,
        companionSessions: cs,
      });
    });

    it('returns null if student not found', async () => {
      studentRepo.findById.mockResolvedValue(null);
      const result = await service.loadStudentBundle('nonexistent');
      expect(result).toBeNull();
    });
  });
});
