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
import { ContractTemplate } from './contract-template.entity';
import { Event } from '../../events/entities/event.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { ContractFieldValue } from './contract-field-value.entity';
import { ContractSignature } from './contract-signature.entity';
import { ContractHistory } from './contract-history.entity';

export enum ContractStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SIGNED = 'signed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_number', length: 30, unique: true })
  contractNumber: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @Column({ name: 'qr_code', length: 100, unique: true })
  qrCode: string;

  @Column({ name: 'qr_code_url', length: 500, nullable: true })
  qrCodeUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ContractStatus.PENDING,
  })
  status: ContractStatus;

  @Column({ name: 'signed_pdf_file_id', nullable: true })
  signedPdfFileId: string;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalAmount: number;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'signed_at', nullable: true })
  signedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => ContractTemplate)
  @JoinColumn({ name: 'template_id' })
  template: ContractTemplate;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'partner_id' })
  partner: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @OneToMany(() => ContractFieldValue, (fv) => fv.contract)
  fieldValues: ContractFieldValue[];

  @OneToMany(() => ContractSignature, (sig) => sig.contract)
  signatures: ContractSignature[];

  @OneToMany(() => ContractHistory, (h) => h.contract)
  histories: ContractHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
