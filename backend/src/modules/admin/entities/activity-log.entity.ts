import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { JSON_COLUMN_TYPE } from '../../../shared/database.utils';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  action: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'target_type', length: 50, nullable: true })
  targetType: string;

  @Column({ name: 'target_id', nullable: true })
  targetId: string;

  @Column({ type: JSON_COLUMN_TYPE, nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
