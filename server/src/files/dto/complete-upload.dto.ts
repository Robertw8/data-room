import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  storageKey!: string;

  @IsUUID()
  dataRoomId!: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}
