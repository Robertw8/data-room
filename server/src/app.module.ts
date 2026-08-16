import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DataRoomsModule } from './data-rooms/data-rooms.module';
import { FoldersModule } from './folders/folders.module';
import { FilesModule } from './files/files.module';
import { SharesModule } from './shares/shares.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    DataRoomsModule,
    FoldersModule,
    FilesModule,
    SharesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
