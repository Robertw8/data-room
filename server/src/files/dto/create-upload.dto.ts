import {
  Equals,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateUploadDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @Equals('application/pdf')
  mimeType!: string;

  @IsInt()
  @IsPositive()
  size!: number;

  @IsUUID()
  dataRoomId!: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}
