import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Event } from './event.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum EventPartnerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('event_partners')
@Unique(['eventId', 'partnerId'])
export class EventPartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @Column({ type: 'varchar', length: 20, default: EventPartnerStatus.PENDING })
  status: EventPartnerStatus;

  @Column({
    name: 'commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  commissionRate: number;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ name: 'cancel_reason', nullable: true })
  cancelReason: string;

  @Column({ type: 'text', nullable: true })
  items: string;

  @ManyToOne(() => Event, (event) => event.partners)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'partner_id' })
  partner: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
