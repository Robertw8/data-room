import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataRoomsService } from 'src/data-rooms/data-rooms.service';
import { FoldersService } from 'src/folders/folders.service';
import { StorageService } from 'src/storage/storage.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateFileDto } from './dto/update-file.dto';
import { MoveFileDto } from './dto/move-file.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataRoomsService: DataRoomsService,
    private readonly foldersService: FoldersService,
    private readonly storage: StorageService,
  ) {}

  private async ensureNameAvailable(
    name: string,
    dataRoomId: string,
    folderId: string | null,
    excludeFileId?: string,
  ) {
    const existingFile = await this.prisma.file.findFirst({
      where: {
        name,
        dataRoomId,
        folderId,
        id: excludeFileId ? { not: excludeFileId } : undefined,
      },
      select: { id: true },
    });

    if (existingFile) {
      throw new ConflictException(
        'A file with this name already exists in this folder.',
      );
    }
  }

  private async saveFile<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A file with this name already exists in this folder.',
        );
      }

      throw error;
    }
  }

  async findOne(userId: string, fileId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        dataRoom: {
          is: {
            ownerId: userId,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    return file;
  }

  async getViewUrl(userId: string, fileId: string) {
    const file = await this.findOne(userId, fileId);

    const viewUrl = await this.storage.generateDownloadUrl(file.storageKey);

    return { viewUrl };
  }

  async update(userId: string, fileId: string, dto: UpdateFileDto) {
    const file = await this.findOne(userId, fileId);

    await this.ensureNameAvailable(
      dto.name,
      file.dataRoomId,
      file.folderId,
      file.id,
    );

    return this.saveFile(() =>
      this.prisma.file.update({
        where: { id: file.id },
        data: { name: dto.name },
      }),
    );
  }

  async move(userId: string, fileId: string, dto: MoveFileDto) {
    const file = await this.findOne(userId, fileId);

    if (dto.folderId !== null) {
      const folder = await this.foldersService.findOne(userId, dto.folderId);

      if (folder.dataRoomId !== file.dataRoomId) {
        throw new NotFoundException('Folder not found in this data room.');
      }
    }

    await this.ensureNameAvailable(
      file.name,
      file.dataRoomId,
      dto.folderId,
      file.id,
    );

    return this.saveFile(() =>
      this.prisma.file.update({
        where: { id: file.id },
        data: { folderId: dto.folderId },
      }),
    );
  }

  async remove(userId: string, fileId: string) {
    const file = await this.findOne(userId, fileId);

    await this.storage.deleteObject(file.storageKey);

    return this.prisma.file.delete({ where: { id: file.id } });
  }

  async createUploadUrl(userId: string, dto: CreateUploadDto) {
    await this.dataRoomsService.findOne(userId, dto.dataRoomId);

    if (dto.folderId) {
      const folder = await this.foldersService.findOne(userId, dto.folderId);

      if (folder.dataRoomId !== dto.dataRoomId) {
        throw new NotFoundException('Folder not found in this data room.');
      }
    }

    const storageKey = `data-rooms/${dto.dataRoomId}/files/${randomUUID()}.pdf`;

    const uploadUrl = await this.storage.generateUploadUrl(
      storageKey,
      dto.mimeType,
    );

    return {
      uploadUrl,
      storageKey,
    };
  }

  async completeUpload(userId: string, dto: CompleteUploadDto) {
    const expectedPrefix = `data-rooms/${dto.dataRoomId}/files/`;

    if (!dto.storageKey.startsWith(expectedPrefix)) {
      throw new BadRequestException('Invalid storage key');
    }

    await this.dataRoomsService.findOne(userId, dto.dataRoomId);

    // Check if folder located in the same room
    if (dto.folderId) {
      const folder = await this.foldersService.findOne(userId, dto.folderId);

      if (folder.dataRoomId !== dto.dataRoomId) {
        throw new NotFoundException('Folder not found in this data room.');
      }
    }

    let metadata;

    // Check if upload actually completed
    try {
      metadata = await this.storage.getObjectMetadata(dto.storageKey);
    } catch {
      throw new BadRequestException('Uploaded file not found in storage.');
    }

    const mimeType = metadata.ContentType;

    if (mimeType !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    const size = metadata.ContentLength;

    if (!size || size <= 0) {
      throw new BadRequestException('Uploaded file is empty.');
    }

    // Avoid complete duplicates
    const existingFile = await this.prisma.file.findUnique({
      where: {
        storageKey: dto.storageKey,
      },
    });

    if (existingFile) {
      throw new ConflictException('Upload has already been completed.');
    }

    await this.ensureNameAvailable(
      dto.name,
      dto.dataRoomId,
      dto.folderId ?? null,
    );

    return this.saveFile(() =>
      this.prisma.file.create({
        data: {
          name: dto.name,
          storageKey: dto.storageKey,
          mimeType,
          size,
          dataRoomId: dto.dataRoomId,
          folderId: dto.folderId,
        },
      }),
    );
  }
}
