import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { DataRoomsService } from 'src/data-rooms/data-rooms.service';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataRoomsService: DataRoomsService,
  ) {}

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

    return this.prisma.folder.create({
      data: {
        name: dto.name,
        dataRoomId: dto.dataRoomId,
        parentId: dto.parentId,
      },
    });
  }

  async update(userId: string, folderId: string, dto: UpdateFolderDto) {
    await this.findOne(userId, folderId);

    return this.prisma.folder.update({
      where: { id: folderId },
      data: dto,
    });
  }

  async delete(userId: string, folderId: string) {
    await this.findOne(userId, folderId);

    return this.prisma.folder.delete({
      where: { id: folderId },
    });
  }
}
