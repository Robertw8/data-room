import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CompleteUploadDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(255)
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
