import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class GenerateDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}
