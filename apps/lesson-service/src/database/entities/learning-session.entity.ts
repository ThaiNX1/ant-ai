import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Robot } from './robot.entity';
import { Lesson } from './lesson.entity';
import { LessonProgress } from './lesson-progress.entity';

@Entity('learning_sessions')
export class LearningSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ type: 'uuid' })
  robotId!: string;

  @ManyToOne(() => Robot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'robot_id' })
  robot!: Robot;

  @Column({ type: 'varchar', length: 20 })
  sessionType!: string;

  @Column({ type: 'uuid', nullable: true })
  lessonId!: string | null;

  @ManyToOne(() => Lesson, { nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: Lesson | null;

  @Column({ type: 'uuid', nullable: true })
  lessonProgressId!: string | null;

  @ManyToOne(() => LessonProgress, { nullable: true })
  @JoinColumn({ name: 'lesson_progress_id' })
  lessonProgress!: LessonProgress | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt!: Date | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  endReason!: string | null;

  @Column({ type: 'int', nullable: true })
  durationSec!: number | null;

  @Column({ type: 'int', default: 0 })
  messagesCount!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
