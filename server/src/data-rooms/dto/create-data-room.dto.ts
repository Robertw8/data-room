import { IsString, Matches, MinLength } from 'class-validator';

export class CreateDataRoomDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/, { message: 'name must not be blank' })
  name!: string;
}
