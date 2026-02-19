import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IcConfig } from './ic-config.entity';

@Entity('ic_apartment_types')
export class IcApartmentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_id' })
  configId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'floor_plan_file_id', nullable: true })
  floorPlanFileId: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => IcConfig, (c) => c.apartmentTypes)
  @JoinColumn({ name: 'config_id' })
  config: IcConfig;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
