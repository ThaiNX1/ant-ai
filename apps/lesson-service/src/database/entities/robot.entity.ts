import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('robots')
export class Robot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  robotId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  firmwareVersion!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'offline' })
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt!: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'jsonb', default: {} })
  config!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
