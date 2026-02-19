import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IcPartnerSheet } from './ic-partner-sheet.entity';
import { IcApartmentType } from './ic-apartment-type.entity';

@Entity('ic_sheet_columns')
export class IcSheetColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sheet_id' })
  sheetId: string;

  @Column({ name: 'apartment_type_id', nullable: true })
  apartmentTypeId: string;

  @Column({ name: 'custom_name', length: 100, nullable: true })
  customName: string;

  @Column({ name: 'column_type', type: 'varchar', length: 10, default: 'amount' })
  columnType: 'text' | 'amount';

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => IcPartnerSheet, (s) => s.columns)
  @JoinColumn({ name: 'sheet_id' })
  sheet: IcPartnerSheet;

  @ManyToOne(() => IcApartmentType)
  @JoinColumn({ name: 'apartment_type_id' })
  apartmentType: IcApartmentType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
