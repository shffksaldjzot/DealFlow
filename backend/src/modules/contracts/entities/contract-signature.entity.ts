import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from './contract.entity';
import { User } from '../../users/entities/user.entity';

@Entity('contract_signatures')
export class ContractSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id' })
  contractId: string;

  @Column({ name: 'signer_id', nullable: true })
  signerId: string;

  @Column({ name: 'signature_data', type: 'text' })
  signatureData: string;

  @Column({ name: 'signature_hash', length: 128 })
  signatureHash: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @ManyToOne(() => Contract, (c) => c.signatures)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'signer_id' })
  signer: User;

  @CreateDateColumn({ name: 'signed_at' })
  signedAt: Date;
}
