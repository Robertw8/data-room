import {
  Equals,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUploadDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/, { message: 'name must not be blank' })
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
