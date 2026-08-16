import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsUUID()
  dataRoomId!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
