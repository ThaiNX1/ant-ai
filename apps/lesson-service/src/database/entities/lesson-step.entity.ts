import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Lesson } from './lesson.entity';

@Entity('lesson_steps')
@Unique(['lessonId', 'stepIndex'])
export class LessonStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  lessonId!: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: Lesson;

  @Column({ type: 'int' })
  stepIndex!: number;

  @Column({ type: 'varchar', length: 30 })
  type!: string;

  @Column({ type: 'jsonb', default: {} })
  config!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
