import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from './contract.entity';
import { JSON_COLUMN_TYPE } from '../../../shared/database.utils';

@Entity('contract_histories')
export class ContractHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id' })
  contractId: string;

  @Column({ name: 'from_status', length: 20, nullable: true })
  fromStatus: string;

  @Column({ name: 'to_status', length: 20 })
  toStatus: string;

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: JSON_COLUMN_TYPE, nullable: true })
  metadata: any;

  @ManyToOne(() => Contract, (c) => c.histories)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
