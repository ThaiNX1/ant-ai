import {
  IsArray, IsBoolean, IsDateString, IsOptional, IsString,
} from 'class-validator';

export class UpdateApiKeyDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  services?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  scopes?: string[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsDateString()
  expiresAt?: Date | null;
}
