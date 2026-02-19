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
import { IcConfig } from './ic-config.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { IcSheetColumn } from './ic-sheet-column.entity';
import { IcSheetRow } from './ic-sheet-row.entity';

export enum IcSheetStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('ic_partner_sheets')
export class IcPartnerSheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_id' })
  configId: string;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @Column({ name: 'category_name', length: 200 })
  categoryName: string;

  @Column({ type: 'text', nullable: true })
  memo: string;

  @Column({ type: 'varchar', length: 20, default: IcSheetStatus.DRAFT })
  status: IcSheetStatus;

  @ManyToOne(() => IcConfig, (c) => c.sheets)
  @JoinColumn({ name: 'config_id' })
  config: IcConfig;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'partner_id' })
  partner: Organization;

  @OneToMany(() => IcSheetColumn, (col) => col.sheet)
  columns: IcSheetColumn[];

  @OneToMany(() => IcSheetRow, (row) => row.sheet)
  rows: IcSheetRow[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
