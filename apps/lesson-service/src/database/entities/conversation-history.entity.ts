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

@Entity('conversation_history')
export class ConversationHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ type: 'uuid', nullable: true })
  robotId!: string | null;

  @ManyToOne(() => Robot, { nullable: true })
  @JoinColumn({ name: 'robot_id' })
  robot!: Robot | null;

  @Column({ type: 'varchar', length: 100 })
  sessionId!: string;

  @Column({ type: 'varchar', length: 20 })
  mode!: string;

  @Column({ type: 'uuid', nullable: true })
  lessonId!: string | null;

  @ManyToOne(() => Lesson, { nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: Lesson | null;

  @Column({ type: 'varchar', length: 20 })
  role!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'int', nullable: true })
  audioDurationMs!: number | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
