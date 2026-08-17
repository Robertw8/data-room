import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @Matches(/\S/, { message: 'name must not be blank' })
  name?: string;
}
