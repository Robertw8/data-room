import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDataRoomDto } from './dto/create-data-room.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateDataRoomDto } from './dto/update-data-room.dto';

@Injectable()
export class DataRoomsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(ownerId: string) {
    return this.prisma.dataRoom.findMany({ where: { ownerId } });
  }

  async findOne(ownerId: string, roomId: string) {
    const room = await this.prisma.dataRoom.findUnique({
      where: { ownerId, id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    return room;
  }

  create(userId: string, dto: CreateDataRoomDto) {
    return this.prisma.dataRoom.create({
      data: {
        ownerId: userId,
        name: dto.name,
      },
    });
  }

  async update(ownerId: string, roomId: string, dto: UpdateDataRoomDto) {
    const targetRoom = await this.findOne(ownerId, roomId);

    return this.prisma.dataRoom.update({
      where: { id: targetRoom.id },
      data: dto,
    });
  }

  async remove(ownerId: string, roomId: string) {
    const targetRoom = await this.findOne(ownerId, roomId);

    return this.prisma.dataRoom.delete({ where: { id: targetRoom.id } });
  }
}
