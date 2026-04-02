import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Student } from './student.entity';

@Entity('companion_sessions')
export class CompanionSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, (s) => s.companionSessions)
  student!: Student;

  @Column()
  studentId!: string;

  @Column()
  mode!: string;

  @Column({ type: 'jsonb', nullable: true })
  conversationHistory!: Record<string, unknown>[] | null;

  @Column({ type: 'jsonb', nullable: true })
  stateData!: Record<string, unknown> | null;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt!: Date | null;
}
