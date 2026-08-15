import { IsString, MinLength } from 'class-validator';

export class CreateDataRoomDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
