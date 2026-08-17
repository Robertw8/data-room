import { IsString, Matches, MinLength } from 'class-validator';

export class UpdateFileDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/, { message: 'name must not be blank' })
  name!: string;
}
