import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { DataRoomsService } from 'src/data-rooms/data-rooms.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  providers: [FoldersService, DataRoomsService],
  controllers: [FoldersController],
  imports: [PrismaModule],
})
export class FoldersModule {}
