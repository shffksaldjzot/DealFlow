import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JSON_COLUMN_TYPE } from '../../../shared/database.utils';

export enum NotificationType {
  ALIMTALK = 'alimtalk',
  PUSH = 'push',
  EMAIL = 'email',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'contract_id', nullable: true })
  contractId: string;

  @Column({ type: 'varchar', length: 20 })
  type: NotificationType;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: JSON_COLUMN_TYPE, nullable: true })
  metadata: any;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
