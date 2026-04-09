import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from './student.entity';
import { Robot } from './robot.entity';

@Entity('student_robots')
@Unique(['studentId', 'robotId'])
export class StudentRobot {
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

  @Column({ type: 'boolean', default: true })
  isPrimary!: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  linkedAt!: Date;
}
