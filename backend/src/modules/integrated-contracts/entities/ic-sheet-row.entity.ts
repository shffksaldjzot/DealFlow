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
import { IcPartnerSheet } from './ic-partner-sheet.entity';

@Entity('ic_sheet_rows')
export class IcSheetRow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sheet_id' })
  sheetId: string;

  @Column({ name: 'option_name', length: 300 })
  optionName: string;

  @Column({ name: 'popup_content', type: 'text', nullable: true })
  popupContent: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: JSON_COLUMN_TYPE, nullable: true })
  prices: Record<string, number>;

  @Column({ name: 'cell_values', type: JSON_COLUMN_TYPE, nullable: true })
  cellValues: Record<string, string>;

  @ManyToOne(() => IcPartnerSheet, (s) => s.rows)
  @JoinColumn({ name: 'sheet_id' })
  sheet: IcPartnerSheet;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
