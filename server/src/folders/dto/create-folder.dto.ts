import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/, { message: 'name must not be blank' })
  name!: string;

  @IsUUID()
  dataRoomId!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
