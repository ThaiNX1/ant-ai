import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class SynthesizeDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}
