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
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FilesService } from './files.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import type { AuthenticatedRequest } from 'src/auth/types/auth.types';
import { UpdateFileDto } from './dto/update-file.dto';
import { MoveFileDto } from './dto/move-file.dto';

@UseGuards(AuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':id/view-url')
  getViewUrl(
    @Req() request: AuthenticatedRequest,
    @Param('id') fileId: string,
  ) {
    return this.filesService.getViewUrl(request.user!.sub, fileId);
  }

  @Get(':id')
  getOne(@Req() request: AuthenticatedRequest, @Param('id') fileId: string) {
    return this.filesService.findOne(request.user!.sub, fileId);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') fileId: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.filesService.update(request.user!.sub, fileId, dto);
  }

  @Patch(':id/move')
  move(
    @Req() request: AuthenticatedRequest,
    @Param('id') fileId: string,
    @Body() dto: MoveFileDto,
  ) {
    return this.filesService.move(request.user!.sub, fileId, dto);
  }

  @Delete(':id')
  delete(@Req() request: AuthenticatedRequest, @Param('id') fileId: string) {
    return this.filesService.remove(request.user!.sub, fileId);
  }

  @Post('upload-url')
  createUploadUrl(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUploadDto,
  ) {
    return this.filesService.createUploadUrl(request.user!.sub, dto);
  }

  @Post('complete')
  completeUpload(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.filesService.completeUpload(request.user!.sub, dto);
  }
}
