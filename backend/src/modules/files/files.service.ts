import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { FileEntity } from './entities/file.entity';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    purpose?: string,
  ): Promise<FileEntity> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // Generate a unique stored name
    const ext = path.extname(file.originalname);
    const storedName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, storedName);

    // Save file to local disk (dev mode)
    fs.writeFileSync(filePath, file.buffer);

    const fileEntity = this.fileRepository.create({
      originalName: file.originalname,
      storedName,
      s3Key: `uploads/${storedName}`, // local path simulating S3 key
      s3Bucket: 'local', // 'local' for dev, actual bucket name for prod
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
      purpose: purpose || 'other',
    });

    return this.fileRepository.save(fileEntity);
  }

  async getFileMetadata(fileId: string): Promise<FileEntity> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }
    return file;
  }

  async getFilePath(fileId: string): Promise<{ filePath: string; file: FileEntity }> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    const filePath = path.join(UPLOAD_DIR, file.storedName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('파일이 서버에서 찾을 수 없습니다.');
    }

    return { filePath, file };
  }
}
