import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Lesson } from './lesson.entity';
import { Enrollment } from './enrollment.entity';
import { Robot } from './robot.entity';

@Entity('lesson_progress')
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ type: 'uuid' })
  lessonId!: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: Lesson;

  @Column({ type: 'uuid' })
  enrollmentId!: string;

  @ManyToOne(() => Enrollment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment!: Enrollment;

  @Column({ type: 'uuid', nullable: true })
  robotId!: string | null;

  @ManyToOne(() => Robot, { nullable: true })
  @JoinColumn({ name: 'robot_id' })
  robot!: Robot | null;

  @Column({ type: 'varchar', length: 20, default: 'not_started' })
  status!: string;

  @Column({ type: 'int', default: 0 })
  currentStep!: number;

  @Column({ type: 'int' })
  totalSteps!: number;

  @Column({ type: 'float', nullable: true })
  score!: number | null;

  @Column({ type: 'int', default: 0 })
  passedSteps!: number;

  @Column({ type: 'int', default: 0 })
  failedSteps!: number;

  @Column({ type: 'int', default: 0 })
  skippedSteps!: number;

  @Column({ type: 'jsonb', default: {} })
  sessionData!: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt!: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pausedReason!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  totalDurationSec!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
