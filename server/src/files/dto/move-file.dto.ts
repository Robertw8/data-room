import { IsUUID, ValidateIf } from 'class-validator';

export class MoveFileDto {
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  folderId!: string | null;
}
