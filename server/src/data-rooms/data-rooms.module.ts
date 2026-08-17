import { Module } from '@nestjs/common';
import { DataRoomsService } from './data-rooms.service';
import { DataRoomsController } from './data-rooms.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  providers: [DataRoomsService],
  controllers: [DataRoomsController],
  imports: [PrismaModule, AuthModule, StorageModule],
  exports: [DataRoomsService],
})
export class DataRoomsModule {}
