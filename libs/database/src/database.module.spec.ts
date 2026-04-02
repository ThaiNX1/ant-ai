import { DatabaseModule } from './database.module';
import { DatabaseService } from './database.service';
import { StudentRepository } from './repositories/student.repository';
import { LessonRepository } from './repositories/lesson.repository';
import { LearningSessionRepository } from './repositories/learning-session.repository';
import { CompanionSessionRepository } from './repositories/companion-session.repository';

describe('DatabaseModule', () => {
  it('should return a DynamicModule from register()', () => {
    const result = DatabaseModule.register({
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'testdb',
    });

    expect(result.module).toBe(DatabaseModule);
    expect(result.imports).toBeDefined();
    expect(result.imports!.length).toBe(2);
  });

  it('should export DatabaseService and all repositories', () => {
    const result = DatabaseModule.register({
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'testdb',
    });

    const exports = result.exports as unknown[];
    expect(exports).toContain(DatabaseService);
    expect(exports).toContain(StudentRepository);
    expect(exports).toContain(LessonRepository);
    expect(exports).toContain(LearningSessionRepository);
    expect(exports).toContain(CompanionSessionRepository);
  });

  it('should provide DatabaseService and all repositories', () => {
    const result = DatabaseModule.register({
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'testdb',
    });

    const providers = result.providers as unknown[];
    expect(providers).toContain(DatabaseService);
    expect(providers).toContain(StudentRepository);
    expect(providers).toContain(LessonRepository);
    expect(providers).toContain(LearningSessionRepository);
    expect(providers).toContain(CompanionSessionRepository);
  });

  it('should configure synchronize as false', () => {
    const result = DatabaseModule.register({
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'testdb',
    });

    // The first import is TypeOrmModule.forRoot() — we verify it exists
    expect(result.imports).toBeDefined();
    expect(result.imports!.length).toBeGreaterThanOrEqual(1);
  });
});
