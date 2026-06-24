import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AudioTranslateDto {
  @IsString()
  @IsNotEmpty()
  sourceLanguage!: string;

  @IsString()
  @IsNotEmpty()
  targetLanguage!: string;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  @IsString()
  audioFormat?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sampleRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  channels?: number;

  @IsOptional()
  @IsString()
  encoding?: string;

  @IsOptional()
  @IsString()
  outputFormat?: string;
}
