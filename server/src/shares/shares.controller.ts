import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SharesService } from './shares.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CreateShareDto } from './dto/create-share.dto';
import type { AuthenticatedRequest } from 'src/auth/types/auth.types';

@UseGuards(AuthGuard)
@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Get('received')
  findReceived(@Req() request: AuthenticatedRequest) {
    return this.sharesService.findReceived(request.user!.sub);
  }

  @Get(':token/folders/:folderId')
  openFolder(
    @Req() request: AuthenticatedRequest,
    @Param('token') token: string,
    @Param('folderId') folderId: string,
  ) {
    return this.sharesService.openUserFolder(
      request.user!.sub,
      token,
      folderId,
    );
  }

  @Get(':token/files/:fileId/view-url')
  getFileViewUrl(
    @Req() request: AuthenticatedRequest,
    @Param('token') token: string,
    @Param('fileId') fileId: string,
  ) {
    return this.sharesService.getUserFileViewUrl(
      request.user!.sub,
      token,
      fileId,
    );
  }

  @Get(':token')
  resolve(@Req() request: AuthenticatedRequest, @Param('token') token: string) {
    return this.sharesService.resolveUser(request.user!.sub, token);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateShareDto) {
    return this.sharesService.create(request.user!.sub, dto);
  }

  @Patch(':id/revoke')
  revoke(@Req() request: AuthenticatedRequest, @Param('id') shareId: string) {
    return this.sharesService.revoke(request.user!.sub, shareId);
  }
}
