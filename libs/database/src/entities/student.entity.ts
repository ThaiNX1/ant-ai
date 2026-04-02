import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LearningSession } from './learning-session.entity';
import { CompanionSession } from './companion-session.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  ssrc!: string;

  @Column()
  accountId!: string;

  @Column()
  deviceId!: string;

  @Column({ type: 'jsonb', nullable: true })
  profile!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => LearningSession, (s) => s.student)
  learningSessions!: LearningSession[];

  @OneToMany(() => CompanionSession, (s) => s.student)
  companionSessions!: CompanionSession[];
}
