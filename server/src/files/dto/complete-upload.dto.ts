import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/, { message: 'name must not be blank' })
  name!: string;

  @IsString()
  storageKey!: string;

  @IsUUID()
  dataRoomId!: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}
