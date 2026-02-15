import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body() dto: UploadFileDto,
  ) {
    return this.filesService.uploadFile(file, userId, dto.purpose);
  }

  @Get(':id')
  getFileMetadata(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getFileMetadata(id);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { filePath, file } = await this.filesService.getFilePath(id);
    res.setHeader('Content-Type', file.mimeType);

    // Image files use inline disposition for preview support
    const isImage = /^image\/(jpeg|jpg|png|gif|webp|svg)/.test(file.mimeType);
    const disposition = isImage ? 'inline' : 'attachment';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(file.originalName)}"`,
    );
    res.sendFile(filePath);
  }
}
