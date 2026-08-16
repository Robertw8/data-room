import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { DataRoomsModule } from 'src/data-rooms/data-rooms.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [FoldersService],
  controllers: [FoldersController],
  imports: [PrismaModule, DataRoomsModule, AuthModule],
  exports: [FoldersService],
})
export class FoldersModule {}
