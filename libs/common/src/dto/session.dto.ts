import { IsUUID, IsOptional, IsString } from 'class-validator';

export class SessionDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsString()
  mode?: string;
}
