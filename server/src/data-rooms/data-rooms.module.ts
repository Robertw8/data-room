import { Module } from '@nestjs/common';
import { DataRoomsService } from './data-rooms.service';
import { DataRoomsController } from './data-rooms.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  providers: [DataRoomsService],
  controllers: [DataRoomsController],
  imports: [PrismaModule],
  exports: [DataRoomsService],
})
export class DataRoomsModule {}
