import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JSON_COLUMN_TYPE } from '../../../shared/database.utils';
import { IcConfig } from './ic-config.entity';
import { IcApartmentType } from './ic-apartment-type.entity';
import { User } from '../../users/entities/user.entity';

export enum IcContractStatus {
  DRAFT = 'draft',
  SIGNED = 'signed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('ic_contracts')
export class IcContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_id' })
  configId: string;

  @Column({ name: 'apartment_type_id' })
  apartmentTypeId: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @Column({ name: 'customer_name', length: 100, nullable: true })
  customerName: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone: string;

  @Column({ name: 'short_code', length: 12, unique: true })
  shortCode: string;

  @Column({ name: 'selected_items', type: JSON_COLUMN_TYPE })
  selectedItems: {
    sheetId: string;
    rowId: string;
    columnId: string;
    optionName: string;
    categoryName: string;
    partnerName: string;
    unitPrice: number;
  }[];

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ name: 'payment_schedule', type: JSON_COLUMN_TYPE, nullable: true })
  paymentSchedule: { name: string; ratio: number; amount: number }[];

  @Column({ name: 'legal_agreed', default: false })
  legalAgreed: boolean;

  @Column({ name: 'signature_data', type: 'text', nullable: true })
  signatureData: string;

  @Column({ type: 'varchar', length: 20, default: IcContractStatus.SIGNED })
  status: IcContractStatus;

  @Column({ name: 'signed_at', nullable: true })
  signedAt: Date;

  @ManyToOne(() => IcConfig, (c) => c.contracts)
  @JoinColumn({ name: 'config_id' })
  config: IcConfig;

  @ManyToOne(() => IcApartmentType)
  @JoinColumn({ name: 'apartment_type_id' })
  apartmentType: IcApartmentType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
