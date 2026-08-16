import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { DataRoomsModule } from 'src/data-rooms/data-rooms.module';
import { FoldersModule } from 'src/folders/folders.module';
import { StorageModule } from 'src/storage/storage.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [FilesService],
  controllers: [FilesController],
  imports: [
    PrismaModule,
    DataRoomsModule,
    FoldersModule,
    StorageModule,
    AuthModule,
  ],
  exports: [FilesService],
})
export class FilesModule {}
