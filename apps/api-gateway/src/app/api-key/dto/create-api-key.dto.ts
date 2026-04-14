import {
  IsString, IsNotEmpty, IsArray, IsOptional, IsDateString,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString() @IsNotEmpty()
  userId!: string;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsArray() @IsString({ each: true })
  services!: string[]; // ['ai-service', 'customer-service']

  @IsArray() @IsString({ each: true })
  scopes!: string[]; // ['tts:*', 'llm:read', '*']

  @IsOptional() @IsDateString()
  expiresAt?: Date;
}
