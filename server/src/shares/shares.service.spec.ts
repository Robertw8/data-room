import { DataRoomsService } from 'src/data-rooms/data-rooms.service';
import { FilesService } from 'src/files/files.service';
import { FoldersService } from 'src/folders/folders.service';
import { ShareType } from 'src/generated/prisma/enums';
import { StorageService } from 'src/storage/storage.service';
import { PrismaService } from 'prisma/prisma.service';
import { ShareTargetType } from './dto/create-share.dto';
import { SharesService } from './shares.service';

describe('SharesService', () => {
  it.each([
    [ShareTargetType.DATAROOM, 'dataRoomId'],
    [ShareTargetType.FOLDER, 'folderId'],
    [ShareTargetType.FILE, 'fileId'],
  ] as const)(
    'creates a %s share with exactly one target',
    async (targetType, targetField) => {
      const targetId = 'target-id';
      let createInput: { data: Record<string, unknown> } | undefined;
      const createShare = jest.fn(
        (input: { data: Record<string, unknown> }) => {
          createInput = input;
          return Promise.resolve({ id: 'share-id' });
        },
      );
      const prisma = {
        share: {
          create: createShare,
        },
      };
      const dataRoomsService = {
        findOne: jest.fn().mockResolvedValue({ id: targetId }),
      };
      const foldersService = {
        findOne: jest.fn().mockResolvedValue({ id: targetId }),
      };
      const filesService = {
        findOne: jest.fn().mockResolvedValue({ id: targetId }),
      };
      const service = new SharesService(
        prisma as unknown as PrismaService,
        dataRoomsService as unknown as DataRoomsService,
        foldersService as unknown as FoldersService,
        filesService as unknown as FilesService,
        {} as unknown as StorageService,
      );

      await service.create('user-id', {
        type: ShareType.PUBLIC,
        targetType,
        targetId,
      });

      if (!createInput) throw new Error('Share was not created.');

      const targetValues = [
        createInput.data.dataRoomId,
        createInput.data.folderId,
        createInput.data.fileId,
      ].filter((value) => value !== null && value !== undefined);

      expect(targetValues).toEqual([targetId]);
      expect(createInput.data[targetField]).toBe(targetId);
    },
  );
});
