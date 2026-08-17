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
import { FoldersService } from './folders.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateFolderDto } from './dto/create-folder.dto';
import type { AuthenticatedRequest } from 'src/auth/types/auth.types';
import { UpdateFolderDto } from './dto/update-folder.dto';

@UseGuards(AuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get(':id')
  getOne(@Req() request: AuthenticatedRequest, @Param('id') folderId: string) {
    return this.foldersService.findOne(request.user!.sub, folderId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateFolderDto) {
    return this.foldersService.create(request.user!.sub, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') folderId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.foldersService.update(request.user!.sub, folderId, dto);
  }

  @Delete(':id')
  delete(@Req() request: AuthenticatedRequest, @Param('id') folderId: string) {
    return this.foldersService.remove(request.user!.sub, folderId);
  }
}
