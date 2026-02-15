import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { FileEntity } from './entities/file.entity';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly configService: ConfigService,
  ) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    if (accountId) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY'),
        },
      });
      this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'dealflow-files';
      this.logger.log('R2 storage configured');
    } else {
      // Local fallback for development
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      this.logger.log('Using local file storage (R2 not configured)');
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

    // Decode Korean filenames (multer receives latin1 encoding)
    const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');

    // Generate a unique stored name
    const ext = path.extname(decodedName);
    const storedName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
    const s3Key = `uploads/${storedName}`;

    if (this.s3Client) {
      // Upload to R2
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } else {
      // Save to local disk
      const filePath = path.join(UPLOAD_DIR, storedName);
      fs.writeFileSync(filePath, file.buffer);
    }

    const fileEntity = this.fileRepository.create({
      originalName: decodedName,
      storedName,
      s3Key,
      s3Bucket: this.s3Client ? this.bucketName : 'local',
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

  async getFileBuffer(fileId: string): Promise<{ buffer: Buffer; file: FileEntity }> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    if (this.s3Client && file.s3Bucket !== 'local') {
      // Download from R2
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: file.s3Bucket,
          Key: file.s3Key,
        }),
      );
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(Buffer.from(chunk));
      }
      return { buffer: Buffer.concat(chunks), file };
    }

    // Local fallback
    const filePath = path.join(UPLOAD_DIR, file.storedName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('파일이 서버에서 찾을 수 없습니다.');
    }
    return { buffer: fs.readFileSync(filePath), file };
  }
}
