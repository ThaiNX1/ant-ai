import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
