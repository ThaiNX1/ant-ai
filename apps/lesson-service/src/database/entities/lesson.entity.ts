import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Course } from './course.entity';
import { LessonStep } from './lesson-step.entity';

@Entity('lessons')
@Unique(['courseId', 'orderIndex'])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Column({ type: 'int' })
  orderIndex!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 0 })
  totalSteps!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  assetPackUrl!: string | null;

  @Column({ type: 'int', nullable: true })
  assetPackSize!: number | null;

  @Column({ type: 'int', nullable: true })
  estimatedDurationMin!: number | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => LessonStep, (step) => step.lesson)
  steps!: LessonStep[];
}
