import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseOptions } from './interfaces/database-options.interface';
import { Student } from './entities/student.entity';
import { Lesson } from './entities/lesson.entity';
import { LearningSession } from './entities/learning-session.entity';
import { CompanionSession } from './entities/companion-session.entity';
import { StudentRepository } from './repositories/student.repository';
import { LessonRepository } from './repositories/lesson.repository';
import { LearningSessionRepository } from './repositories/learning-session.repository';
import { CompanionSessionRepository } from './repositories/companion-session.repository';
import { DatabaseService } from './database.service';

const entities = [Student, Lesson, LearningSession, CompanionSession];

@Module({})
export class DatabaseModule {
  static register(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: options.host,
          port: options.port,
          username: options.username,
          password: options.password,
          database: options.database,
          entities,
          synchronize: false,
        }),
        TypeOrmModule.forFeature(entities),
      ],
      providers: [
        DatabaseService,
        StudentRepository,
        LessonRepository,
        LearningSessionRepository,
        CompanionSessionRepository,
      ],
      exports: [
        DatabaseService,
        StudentRepository,
        LessonRepository,
        LearningSessionRepository,
        CompanionSessionRepository,
      ],
    };
  }
}
