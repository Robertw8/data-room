import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;
}
