import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Contract } from './contract.entity';
import { ContractField } from './contract-field.entity';

@Entity('contract_field_values')
@Unique(['contractId', 'fieldId'])
export class ContractFieldValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id' })
  contractId: string;

  @Column({ name: 'field_id' })
  fieldId: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @ManyToOne(() => Contract, (c) => c.fieldValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => ContractField)
  @JoinColumn({ name: 'field_id' })
  field: ContractField;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
