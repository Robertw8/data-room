import { Controller, Get, Param } from '@nestjs/common';
import { SharesService } from './shares.service';

@Controller('public/shares')
export class PublicSharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Get(':token/folders/:folderId')
  openFolder(
    @Param('token') token: string,
    @Param('folderId') folderId: string,
  ) {
    return this.sharesService.openPublicFolder(token, folderId);
  }

  @Get(':token/files/:fileId/view-url')
  getFileViewUrl(
    @Param('token') token: string,
    @Param('fileId') fileId: string,
  ) {
    return this.sharesService.getPublicFileViewUrl(token, fileId);
  }

  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.sharesService.resolvePublic(token);
  }
}
