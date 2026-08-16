import { IsEmail, IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { ShareType } from 'src/generated/prisma/enums';

export enum ShareTargetType {
  DATAROOM = 'DATAROOM',
  FOLDER = 'FOLDER',
  FILE = 'FILE',
}

export class CreateShareDto {
  @IsEnum(ShareType)
  type!: ShareType;

  @IsEnum(ShareTargetType)
  targetType!: ShareTargetType;

  @IsUUID()
  targetId!: string;

  @ValidateIf((dto: CreateShareDto) => dto.type === ShareType.USER)
  @IsEmail()
  recipientEmail?: string;
}
