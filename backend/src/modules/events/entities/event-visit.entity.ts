import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('event_visits')
export class EventVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 20, default: 'reserved' })
  status: string;

  @Column({ name: 'visit_date', type: 'date' })
  visitDate: string;

  @Column({ name: 'guest_count', default: 1 })
  guestCount: number;

  @Column({ nullable: true })
  memo: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
