import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContractTemplate } from './contract-template.entity';
import { JSON_COLUMN_TYPE } from '../../../shared/database.utils';

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CHECKBOX = 'checkbox',
  AMOUNT = 'amount',
  DATE = 'date',
  SIGNATURE = 'signature',
}

@Entity('contract_fields')
export class ContractField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'field_type', type: 'varchar', length: 20 })
  fieldType: FieldType;

  @Column({ length: 200 })
  label: string;

  @Column({ length: 200, nullable: true })
  placeholder: string;

  @Column({ name: 'is_required', default: true })
  isRequired: boolean;

  @Column({ name: 'page_number', default: 1 })
  pageNumber: number;

  @Column({ name: 'position_x', type: 'decimal', precision: 7, scale: 2 })
  positionX: number;

  @Column({ name: 'position_y', type: 'decimal', precision: 7, scale: 2 })
  positionY: number;

  @Column({ type: 'decimal', precision: 7, scale: 2 })
  width: number;

  @Column({ type: 'decimal', precision: 7, scale: 2 })
  height: number;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue: string;

  @Column({ name: 'validation_rule', type: JSON_COLUMN_TYPE, nullable: true })
  validationRule: any;

  @ManyToOne(() => ContractTemplate, (template) => template.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template: ContractTemplate;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
