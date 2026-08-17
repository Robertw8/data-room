import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDataRoomDto } from './dto/create-data-room.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateDataRoomDto } from './dto/update-data-room.dto';
import { StorageService } from 'src/storage/storage.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class DataRoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async ensureNameAvailable(
    name: string,
    ownerId: string,
    excludeRoomId?: string,
  ) {
    const existingRoom = await this.prisma.dataRoom.findFirst({
      where: {
        name,
        ownerId,
        id: excludeRoomId ? { not: excludeRoomId } : undefined,
      },
      select: { id: true },
    });

    if (existingRoom) {
      throw new ConflictException('A Data Room with this name already exists.');
    }
  }

  private async saveDataRoom<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A Data Room with this name already exists.',
        );
      }

      throw error;
    }
  }

  findAll(ownerId: string) {
    return this.prisma.dataRoom.findMany({ where: { ownerId } });
  }

  async findOne(ownerId: string, roomId: string) {
    const room = await this.prisma.dataRoom.findUnique({
      where: { ownerId, id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    return room;
  }

  async create(userId: string, dto: CreateDataRoomDto) {
    await this.ensureNameAvailable(dto.name, userId);

    return this.saveDataRoom(() =>
      this.prisma.dataRoom.create({
        data: {
          ownerId: userId,
          name: dto.name,
        },
      }),
    );
  }

  async update(ownerId: string, roomId: string, dto: UpdateDataRoomDto) {
    const targetRoom = await this.findOne(ownerId, roomId);

    if (dto.name !== undefined) {
      await this.ensureNameAvailable(dto.name, ownerId, targetRoom.id);
    }

    return this.saveDataRoom(() =>
      this.prisma.dataRoom.update({
        where: { id: targetRoom.id },
        data: dto,
      }),
    );
  }

  async getDeletionStats(ownerId: string, roomId: string) {
    const targetRoom = await this.findOne(ownerId, roomId);
    const [folderCount, files] = await Promise.all([
      this.prisma.folder.count({
        where: { dataRoomId: targetRoom.id },
      }),
      this.prisma.file.aggregate({
        where: { dataRoomId: targetRoom.id },
        _count: { _all: true },
        _sum: { size: true },
      }),
    ]);

    return {
      folderCount,
      fileCount: files._count._all,
      totalSize: files._sum.size ?? 0,
    };
  }

  async remove(ownerId: string, roomId: string) {
    const targetRoom = await this.findOne(ownerId, roomId);

    const files = await this.prisma.file.findMany({
      where: {
        dataRoomId: targetRoom.id,
      },
      select: {
        storageKey: true,
      },
    });

    await this.storage.deleteObjects(files.map((file) => file.storageKey));

    return this.prisma.dataRoom.delete({ where: { id: targetRoom.id } });
  }

  async findRoomFolders(ownerId: string, roomId: string) {
    const targetRoom = await this.findOne(ownerId, roomId);

    return this.prisma.folder.findMany({
      where: { dataRoomId: targetRoom.id, parentId: null },
    });
  }

  async findRoomContents(ownerId: string, roomId: string) {
    const targetRoom = await this.findOne(ownerId, roomId);

    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { dataRoomId: targetRoom.id, parentId: null },
      }),
      this.prisma.file.findMany({
        where: { dataRoomId: targetRoom.id, folderId: null },
      }),
    ]);

    return { folders, files };
  }
}
