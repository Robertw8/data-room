import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { DataRoomsService } from 'src/data-rooms/data-rooms.service';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { StorageService } from 'src/storage/storage.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataRoomsService: DataRoomsService,
    private readonly storage: StorageService,
  ) {}

  private async ensureNameAvailable(
    name: string,
    dataRoomId: string,
    parentId: string | null,
    excludeFolderId?: string,
  ) {
    const existingFolder = await this.prisma.folder.findFirst({
      where: {
        name,
        dataRoomId,
        parentId,
        id: excludeFolderId ? { not: excludeFolderId } : undefined,
      },
      select: { id: true },
    });

    if (existingFolder) {
      throw new ConflictException(
        'A folder with this name already exists in this location.',
      );
    }
  }

  private async saveFolder<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A folder with this name already exists in this location.',
        );
      }

      throw error;
    }
  }

  private async getSubtreeFolderIds(folderId: string, dataRoomId: string) {
    const folderIds = [folderId];
    const visited = new Set(folderIds);
    let parentIds = [folderId];

    while (parentIds.length > 0) {
      const children = await this.prisma.folder.findMany({
        where: {
          dataRoomId,
          parentId: { in: parentIds },
        },
        select: { id: true },
      });
      const childIds = children
        .map((folder) => folder.id)
        .filter((id) => !visited.has(id));

      childIds.forEach((id) => visited.add(id));
      folderIds.push(...childIds);
      parentIds = childIds;
    }

    return folderIds;
  }

  private async getBreadcrumbs(folderId: string, dataRoomId: string) {
    const breadcrumbs: { id: string; name: string }[] = [];

    let currentFolder = await this.prisma.folder.findFirst({
      where: { id: folderId, dataRoomId },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    while (currentFolder) {
      breadcrumbs.push({
        id: currentFolder.id,
        name: currentFolder.name,
      });

      if (!currentFolder.parentId) break;

      currentFolder = await this.prisma.folder.findFirst({
        where: {
          id: currentFolder.parentId,
          dataRoomId,
        },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      });
    }

    return breadcrumbs.reverse();
  }

  async findOne(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        dataRoom: {
          is: {
            ownerId: userId,
          },
        },
      },
      include: {
        children: true,
        files: true,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found.');
    }

    const breadcrumbs = await this.getBreadcrumbs(folder.id, folder.dataRoomId);

    return { ...folder, breadcrumbs };
  }

  async create(userId: string, dto: CreateFolderDto) {
    await this.dataRoomsService.findOne(userId, dto.dataRoomId);

    if (dto.parentId) {
      const parentFolder = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentFolder || parentFolder.dataRoomId !== dto.dataRoomId) {
        throw new NotFoundException(
          'Parent folder not found in this data room.',
        );
      }
    }

    await this.ensureNameAvailable(
      dto.name,
      dto.dataRoomId,
      dto.parentId ?? null,
    );

    return this.saveFolder(() =>
      this.prisma.folder.create({
        data: {
          name: dto.name,
          dataRoomId: dto.dataRoomId,
          parentId: dto.parentId,
        },
      }),
    );
  }

  async update(userId: string, folderId: string, dto: UpdateFolderDto) {
    const folder = await this.findOne(userId, folderId);

    if (dto.name !== undefined) {
      await this.ensureNameAvailable(
        dto.name,
        folder.dataRoomId,
        folder.parentId,
        folder.id,
      );
    }

    return this.saveFolder(() =>
      this.prisma.folder.update({
        where: { id: folder.id },
        data: dto,
      }),
    );
  }

  async getDeletionStats(userId: string, folderId: string) {
    const targetFolder = await this.findOne(userId, folderId);
    const subtreeFolderIds = await this.getSubtreeFolderIds(
      targetFolder.id,
      targetFolder.dataRoomId,
    );
    const files = await this.prisma.file.aggregate({
      where: {
        dataRoomId: targetFolder.dataRoomId,
        folderId: { in: subtreeFolderIds },
      },
      _count: { _all: true },
      _sum: { size: true },
    });

    return {
      folderCount: subtreeFolderIds.length,
      fileCount: files._count._all,
      totalSize: files._sum.size ?? 0,
    };
  }

  async remove(userId: string, folderId: string) {
    const targetFolder = await this.findOne(userId, folderId);
    const subtreeFolderIds = await this.getSubtreeFolderIds(
      targetFolder.id,
      targetFolder.dataRoomId,
    );
    const files = await this.prisma.file.findMany({
      where: {
        dataRoomId: targetFolder.dataRoomId,
        folderId: { in: subtreeFolderIds },
      },
      select: { storageKey: true },
    });

    await this.storage.deleteObjects(files.map((file) => file.storageKey));

    return this.prisma.folder.delete({
      where: { id: targetFolder.id },
    });
  }
}
