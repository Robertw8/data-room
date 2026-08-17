import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateShareDto, ShareTargetType } from './dto/create-share.dto';
import { DataRoomsService } from 'src/data-rooms/data-rooms.service';
import { FoldersService } from 'src/folders/folders.service';
import { FilesService } from 'src/files/files.service';
import { ShareRole, ShareType } from 'src/generated/prisma/enums';
import { randomUUID } from 'crypto';
import { StorageService } from 'src/storage/storage.service';

type ShareAccess = {
  id: string;
  token: string;
  type: ShareType;
  role: ShareRole;
  dataRoomId: string | null;
  folderId: string | null;
  fileId: string | null;
  createdAt: Date;
};

type FolderNode = {
  id: string;
  name: string;
  dataRoomId: string;
  parentId: string | null;
};

type FileNode = {
  id: string;
  dataRoomId: string;
  folderId: string | null;
};

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataRoomsService: DataRoomsService,
    private readonly foldersService: FoldersService,
    private readonly filesService: FilesService,
    private readonly storage: StorageService,
  ) {}

  private shareSummary(share: ShareAccess) {
    return {
      id: share.id,
      token: share.token,
      type: share.type,
      role: share.role,
      createdAt: share.createdAt,
    };
  }

  private getTargetType(share: ShareAccess): ShareTargetType {
    if (share.dataRoomId) return ShareTargetType.DATAROOM;
    if (share.folderId) return ShareTargetType.FOLDER;
    if (share.fileId) return ShareTargetType.FILE;

    throw new NotFoundException('Share not found.');
  }

  private async findPublicShare(token: string) {
    const share = await this.prisma.share.findFirst({
      where: {
        token,
        type: ShareType.PUBLIC,
        revokedAt: null,
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found.');
    }

    return share;
  }

  private async findUserShare(userId: string, token: string) {
    const share = await this.prisma.share.findFirst({
      where: {
        token,
        type: ShareType.USER,
        recipientUserId: userId,
        revokedAt: null,
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found.');
    }

    return share;
  }

  private findFolder(folderId: string) {
    return this.prisma.folder.findUnique({
      where: { id: folderId },
      select: {
        id: true,
        name: true,
        dataRoomId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async getFolderPath(folder: FolderNode) {
    const path: FolderNode[] = [folder];
    const visited = new Set([folder.id]);
    let current = folder;

    while (current.parentId && !visited.has(current.parentId)) {
      visited.add(current.parentId);

      const parent = await this.prisma.folder.findFirst({
        where: {
          id: current.parentId,
          dataRoomId: folder.dataRoomId,
        },
        select: {
          id: true,
          name: true,
          dataRoomId: true,
          parentId: true,
        },
      });

      if (!parent) break;

      path.push(parent);
      current = parent;
    }

    return path.reverse();
  }

  private async getAccessibleBreadcrumbs(
    share: ShareAccess,
    folder: FolderNode,
  ) {
    const targetType = this.getTargetType(share);

    if (
      targetType === ShareTargetType.DATAROOM &&
      folder.dataRoomId !== share.dataRoomId
    ) {
      return null;
    }

    if (targetType === ShareTargetType.FILE) {
      return null;
    }

    const path = await this.getFolderPath(folder);

    if (targetType === ShareTargetType.FOLDER) {
      const sharedRootIndex = path.findIndex(
        (item) => item.id === share.folderId,
      );

      if (sharedRootIndex === -1) return null;

      return path.slice(sharedRootIndex).map(({ id, name }) => ({ id, name }));
    }

    return path.map(({ id, name }) => ({ id, name }));
  }

  private async getDirectoryContents(
    dataRoomId: string,
    folderId: string | null,
  ) {
    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { dataRoomId, parentId: folderId },
        select: {
          id: true,
          name: true,
          dataRoomId: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.file.findMany({
        where: { dataRoomId, folderId },
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
          dataRoomId: true,
          folderId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return { folders, files };
  }

  private async isFileAccessible(share: ShareAccess, file: FileNode) {
    switch (this.getTargetType(share)) {
      case ShareTargetType.DATAROOM:
        return file.dataRoomId === share.dataRoomId;

      case ShareTargetType.FOLDER: {
        if (!file.folderId) return false;

        const folder = await this.findFolder(file.folderId);

        if (!folder || folder.dataRoomId !== file.dataRoomId) return false;

        return (await this.getAccessibleBreadcrumbs(share, folder)) !== null;
      }

      case ShareTargetType.FILE:
        return file.id === share.fileId;
    }
  }

  private async resolveRoot(share: ShareAccess) {
    const targetType = this.getTargetType(share);

    switch (targetType) {
      case ShareTargetType.DATAROOM: {
        const item = await this.prisma.dataRoom.findUnique({
          where: { id: share.dataRoomId! },
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!item) throw new NotFoundException('Shared resource not found.');

        const contents = await this.getDirectoryContents(item.id, null);

        return {
          share: this.shareSummary(share),
          targetType,
          item,
          contents,
        };
      }

      case ShareTargetType.FOLDER:
        return this.resolveFolder(share, share.folderId!);

      case ShareTargetType.FILE: {
        const item = await this.prisma.file.findUnique({
          where: { id: share.fileId! },
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            dataRoomId: true,
            folderId: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!item) throw new NotFoundException('Shared resource not found.');

        return {
          share: this.shareSummary(share),
          targetType,
          item,
        };
      }
    }
  }

  private async resolveFolder(share: ShareAccess, folderId: string) {
    const folder = await this.findFolder(folderId);

    if (!folder) {
      throw new NotFoundException('Shared resource not found.');
    }

    const breadcrumbs = await this.getAccessibleBreadcrumbs(share, folder);

    if (!breadcrumbs) {
      throw new NotFoundException('Shared resource not found.');
    }

    const contents = await this.getDirectoryContents(
      folder.dataRoomId,
      folder.id,
    );
    const item =
      this.getTargetType(share) === ShareTargetType.FOLDER &&
      folder.id === share.folderId
        ? { ...folder, parentId: null }
        : folder;

    return {
      share: this.shareSummary(share),
      targetType: ShareTargetType.FOLDER,
      item,
      contents,
      breadcrumbs,
    };
  }

  private async getFileViewUrl(share: ShareAccess, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        dataRoomId: true,
        folderId: true,
        storageKey: true,
      },
    });

    if (!file || !(await this.isFileAccessible(share, file))) {
      throw new NotFoundException('Shared resource not found.');
    }

    const viewUrl = await this.storage.generateDownloadUrl(file.storageKey);

    return { viewUrl };
  }

  async findCreated(userId: string) {
    return this.prisma.share.findMany({
      where: {
        createdById: userId,
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        token: true,
        type: true,
        role: true,
        recipientUserId: true,
        recipientUser: {
          select: {
            id: true,
            email: true,
          },
        },
        dataRoomId: true,
        folderId: true,
        fileId: true,
        dataRoom: {
          select: {
            id: true,
            name: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            dataRoomId: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
            dataRoomId: true,
            folderId: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async findReceived(userId: string) {
    const shares = await this.prisma.share.findMany({
      where: {
        type: ShareType.USER,
        recipientUserId: userId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        type: true,
        role: true,
        dataRoomId: true,
        folderId: true,
        fileId: true,
        createdAt: true,
        dataRoom: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            dataRoomId: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            dataRoomId: true,
            folderId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return shares.map(({ dataRoom, folder, file, ...share }) => {
      const targetType = this.getTargetType(share);
      const item =
        targetType === ShareTargetType.FOLDER && folder
          ? { ...folder, parentId: null }
          : (dataRoom ?? folder ?? file);

      return {
        share: this.shareSummary(share),
        targetType,
        item,
      };
    });
  }

  async resolvePublic(token: string) {
    return this.resolveRoot(await this.findPublicShare(token));
  }

  async openPublicFolder(token: string, folderId: string) {
    return this.resolveFolder(await this.findPublicShare(token), folderId);
  }

  async getPublicFileViewUrl(token: string, fileId: string) {
    return this.getFileViewUrl(await this.findPublicShare(token), fileId);
  }

  async resolveUser(userId: string, token: string) {
    return this.resolveRoot(await this.findUserShare(userId, token));
  }

  async openUserFolder(userId: string, token: string, folderId: string) {
    return this.resolveFolder(
      await this.findUserShare(userId, token),
      folderId,
    );
  }

  async getUserFileViewUrl(userId: string, token: string, fileId: string) {
    return this.getFileViewUrl(await this.findUserShare(userId, token), fileId);
  }

  async create(userId: string, dto: CreateShareDto) {
    let recipientUserId: string | null = null;

    if (dto.type === ShareType.USER) {
      if (!dto.recipientEmail) {
        throw new BadRequestException('Recipient email is required.');
      }

      const recipient = await this.prisma.user.findUnique({
        where: { email: dto.recipientEmail },
      });

      if (!recipient) {
        throw new NotFoundException('Recipient user not found.');
      }

      if (recipient.id === userId) {
        throw new BadRequestException(
          'You cannot share an item with yourself.',
        );
      }

      recipientUserId = recipient.id;
    }

    if (dto.type === ShareType.PUBLIC && dto.recipientEmail) {
      throw new BadRequestException('Public shares cannot have a recipient.');
    }

    const basePayload = {
      token: randomUUID(),
      type: dto.type,
      role: ShareRole.VIEWER, // Only viewer role is available in MVP
      createdById: userId,
      recipientUserId,
    };

    switch (dto.targetType) {
      case ShareTargetType.DATAROOM: {
        const targetRoom = await this.dataRoomsService.findOne(
          userId,
          dto.targetId,
        );

        return this.prisma.share.create({
          data: {
            ...basePayload,
            dataRoomId: targetRoom.id,
          },
        });
      }

      case ShareTargetType.FOLDER: {
        const targetFolder = await this.foldersService.findOne(
          userId,
          dto.targetId,
        );

        return this.prisma.share.create({
          data: {
            ...basePayload,
            folderId: targetFolder.id,
          },
        });
      }

      case ShareTargetType.FILE: {
        const targetFile = await this.filesService.findOne(
          userId,
          dto.targetId,
        );

        return this.prisma.share.create({
          data: {
            ...basePayload,
            fileId: targetFile.id,
          },
        });
      }
    }
  }

  async revoke(userId: string, shareId: string) {
    const targetShare = await this.prisma.share.findFirst({
      where: {
        id: shareId,
        createdById: userId,
        revokedAt: null,
      },
    });

    if (!targetShare) {
      throw new NotFoundException('Share not found.');
    }

    return this.prisma.share.update({
      where: {
        id: targetShare.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
