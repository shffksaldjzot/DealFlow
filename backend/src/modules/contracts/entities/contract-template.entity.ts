import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { ContractField } from './contract-field.entity';

@Entity('contract_templates')
export class ContractTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @Column({ length: 300 })
  name: string;

  @Column({ name: 'file_id' })
  fileId: string;

  @Column({ name: 'file_type', length: 10 })
  fileType: string;

  @Column({ name: 'page_count', default: 1 })
  pageCount: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'partner_id' })
  partner: Organization;

  @OneToMany(() => ContractField, (field) => field.template)
  fields: ContractField[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
