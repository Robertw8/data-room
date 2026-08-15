import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateDataRoomDto } from './dto/create-data-room.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { DataRoomsService } from './data-rooms.service';
import { UpdateDataRoomDto } from './dto/update-data-room.dto';
import type { AuthenticatedRequest } from 'src/auth/types/auth.types';

@UseGuards(AuthGuard)
@Controller('data-rooms')
export class DataRoomsController {
  constructor(private readonly dataRoomsService: DataRoomsService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.dataRoomsService.findAll(request.user!.sub);
  }

  @Get(':id')
  getOne(@Req() request: AuthenticatedRequest, @Param('id') roomId: string) {
    return this.dataRoomsService.findOne(request.user!.sub, roomId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateDataRoomDto) {
    return this.dataRoomsService.create(request.user!.sub, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') roomId: string,
    @Body() dto: UpdateDataRoomDto,
  ) {
    return this.dataRoomsService.update(request.user!.sub, roomId, dto);
  }

  @Delete(':id')
  delete(@Req() request: AuthenticatedRequest, @Param('id') roomId: string) {
    return this.dataRoomsService.remove(request.user!.sub, roomId);
  }
}
