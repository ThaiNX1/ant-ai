import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Student } from './student.entity';
import { Lesson } from './lesson.entity';

@Entity('learning_sessions')
export class LearningSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.learningSessions)
  student!: Student;

  @Column()
  studentId!: string;

  @ManyToOne(() => Lesson, (l) => l.learningSessions)
  lesson!: Lesson;

  @Column()
  lessonId!: string;

  @Column({ default: 'active' })
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  stateData!: Record<string, unknown> | null;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt!: Date | null;
}
