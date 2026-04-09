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
import { Student } from './student.entity';

@Entity('student_word_stats')
@Unique(['studentId', 'word', 'language'])
export class StudentWordStats {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ type: 'varchar', length: 100 })
  word!: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language!: string;

  @Column({ type: 'int', default: 0 })
  totalAttempts!: number;

  @Column({ type: 'int', default: 0 })
  correctAttempts!: number;

  @Column({ type: 'float', nullable: true })
  bestPronunciationScore!: number | null;

  @Column({ type: 'float', nullable: true })
  avgPronunciationScore!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  lastPracticedAt!: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  masteryLevel!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
