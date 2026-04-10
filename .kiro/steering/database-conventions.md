---
inclusion: fileMatch
fileMatchPattern: "**/*.entity.ts,**/*.repository.ts,**/database/**,**/migration/**,**/*.sql"
---

# Database Conventions

## ORM & Driver
- TypeORM 0.3 + PostgreSQL 16
- Repository pattern qua @nestjs/typeorm
- DatabaseModule.register() cho connection config

## Entity Pattern

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('table_name')  // snake_case cho table name
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

## Naming Rules
- Table names: snake_case, số nhiều — `learning_sessions`, `student_profiles`
- Column names: snake_case — `created_at`, `is_active`
- Entity class: PascalCase, số ít — `LearningSession`, `StudentProfile`
- Repository class: `<Entity>Repository` — `StudentRepository`
- Foreign keys: `<related_table>_id` — `student_id`, `lesson_id`
- Index names: `idx_<table>_<columns>` — `idx_students_email`

## Repository Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FeatureRepository extends BaseRepository<FeatureEntity> {
  constructor(
    @InjectRepository(FeatureEntity)
    repository: Repository<FeatureEntity>,
  ) {
    super(repository);
  }
  // Custom query methods here
}
```

## Rules
- Luôn có `created_at` và `updated_at` columns
- Dùng UUID cho primary keys
- Dùng `@Column` decorator với explicit type
- Không dùng `synchronize: true` trong production
- Dùng migrations cho schema changes
- Không viết raw SQL trừ khi TypeORM không hỗ trợ
- Validate data ở DTO layer trước khi persist
