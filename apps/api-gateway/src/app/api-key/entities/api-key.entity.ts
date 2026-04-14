import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('api_keys')
export class ApiKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'key_hash', length: 64 })
  keyHash!: string; // SHA-256 hash of the raw key (never store raw)

  @Column({ name: 'key_prefix', length: 12 })
  keyPrefix!: string; // First 12 chars of raw key for display (e.g. "ant_a3f8b2c9")

  @Column({ name: 'user_id', length: 36 })
  userId!: string;

  @Column({ name: 'name', length: 100 })
  name!: string; // Human-readable label e.g. "Production key"

  @Column({ name: 'services', type: 'simple-array' })
  services!: string[]; // ['ai-service', 'customer-service']

  @Column({ name: 'scopes', type: 'simple-array' })
  scopes!: string[]; // ['tts:*', 'llm:read', '*']

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
