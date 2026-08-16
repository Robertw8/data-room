import { Module } from '@nestjs/common';
import { SharesService } from './shares.service';
import { SharesController } from './shares.controller';
import { DataRoomsModule } from 'src/data-rooms/data-rooms.module';
import { FoldersModule } from 'src/folders/folders.module';
import { FilesModule } from 'src/files/files.module';
import { PrismaModule } from 'prisma/prisma.module';
import { PublicSharesController } from './public-shares.controller';
import { StorageModule } from 'src/storage/storage.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [SharesService],
  controllers: [SharesController, PublicSharesController],
  imports: [
    PrismaModule,
    DataRoomsModule,
    FoldersModule,
    FilesModule,
    StorageModule,
    AuthModule,
  ],
})
export class SharesModule {}
