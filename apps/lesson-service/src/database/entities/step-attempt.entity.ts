import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LessonProgress } from './lesson-progress.entity';

@Entity('step_attempts')
export class StepAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  lessonProgressId!: string;

  @ManyToOne(() => LessonProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_progress_id' })
  lessonProgress!: LessonProgress;

  @Column({ type: 'int' })
  stepIndex!: number;

  @Column({ type: 'varchar', length: 30 })
  stepType!: string;

  @Column({ type: 'int' })
  attemptNumber!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  inputType!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sttText!: string | null;

  @Column({ type: 'float', nullable: true })
  sttConfidence!: number | null;

  @Column({ type: 'float', nullable: true })
  pronunciationScore!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  pronunciationDetail!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  selectedOption!: string | null;

  @Column({ type: 'boolean', default: false })
  isCorrect!: boolean;

  @Column({ type: 'varchar', length: 30, nullable: true })
  completionReason!: string | null;

  @Column({ type: 'text', nullable: true })
  feedbackGiven!: string | null;

  @Column({ type: 'int', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  audioUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
