import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'original_name', length: 500 })
  originalName: string;

  @Column({ name: 'stored_name', length: 500 })
  storedName: string;

  @Column({ name: 's3_key', length: 500 })
  s3Key: string;

  @Column({ name: 's3_bucket', length: 200 })
  s3Bucket: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @Column({
    length: 30,
    default: 'other',
  })
  purpose: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
