import { DataRoomsService } from 'src/data-rooms/data-rooms.service';
import { FoldersService } from 'src/folders/folders.service';
import { PrismaService } from 'prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { MAX_PDF_SIZE_BYTES } from './files.constants';
import { FilesService } from './files.service';

describe('FilesService', () => {
  it('rejects an uploaded object larger than 50 MB before saving metadata', async () => {
    const prisma = {
      file: {
        create: jest.fn(),
      },
    };
    const dataRoomsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'data-room-id' }),
    };
    const storage = {
      getObjectMetadata: jest.fn().mockResolvedValue({
        ContentType: 'application/pdf',
        ContentLength: MAX_PDF_SIZE_BYTES + 1,
      }),
    };
    const service = new FilesService(
      prisma as unknown as PrismaService,
      dataRoomsService as unknown as DataRoomsService,
      {} as unknown as FoldersService,
      storage as unknown as StorageService,
    );

    await expect(
      service.completeUpload('user-id', {
        name: 'Report.pdf',
        storageKey: 'data-rooms/data-room-id/files/report.pdf',
        dataRoomId: 'data-room-id',
      }),
    ).rejects.toThrow('PDF files must be 50 MB or smaller.');
    expect(prisma.file.create).not.toHaveBeenCalled();
  });
});
