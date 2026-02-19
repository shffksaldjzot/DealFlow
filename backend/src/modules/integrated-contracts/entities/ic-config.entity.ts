import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { JSON_COLUMN_TYPE } from '../../../shared/database.utils';
import { Event } from '../../events/entities/event.entity';
import { IcApartmentType } from './ic-apartment-type.entity';
import { IcPartnerSheet } from './ic-partner-sheet.entity';
import { IcContract } from './ic-contract.entity';

export enum IcConfigStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('ic_configs')
@Unique(['eventId'])
export class IcConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'payment_stages', type: JSON_COLUMN_TYPE, nullable: true })
  paymentStages: { name: string; ratio: number }[];

  @Column({ name: 'legal_terms', type: 'text', nullable: true })
  legalTerms: string;

  @Column({ name: 'special_notes', type: 'text', nullable: true })
  specialNotes: string;

  @Column({ type: 'varchar', length: 20, default: IcConfigStatus.DRAFT })
  status: IcConfigStatus;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @OneToMany(() => IcApartmentType, (t) => t.config)
  apartmentTypes: IcApartmentType[];

  @OneToMany(() => IcPartnerSheet, (s) => s.config)
  sheets: IcPartnerSheet[];

  @OneToMany(() => IcContract, (c) => c.config)
  contracts: IcContract[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
