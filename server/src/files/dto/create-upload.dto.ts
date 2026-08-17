import { Transform } from 'class-transformer';
import {
  Equals,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MAX_PDF_SIZE_BYTES } from '../files.constants';

export class CreateUploadDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/\S/, { message: 'name must not be blank' })
  name!: string;

  @Equals('application/pdf')
  mimeType!: string;

  @IsInt()
  @IsPositive()
  @Max(MAX_PDF_SIZE_BYTES, {
    message: 'PDF files must be 50 MB or smaller.',
  })
  size!: number;

  @IsUUID()
  dataRoomId!: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}
