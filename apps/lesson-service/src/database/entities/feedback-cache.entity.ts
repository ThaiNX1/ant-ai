import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';

@Entity('feedback_cache')
export class FeedbackCache {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  cacheKey!: string;

  @Column({ type: 'varchar', length: 20 })
  cacheType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  word!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  scoreBucket!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  weakPhoneme!: string | null;

  @Column({ type: 'text' })
  feedbackText!: string;

  @Column({ type: 'varchar', length: 20, default: 'llm' })
  source!: string;

  @Column({ type: 'int', default: 0 })
  hitCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastHitAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  lessonId!: string | null;

  @ManyToOne(() => Lesson, { nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: Lesson | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
