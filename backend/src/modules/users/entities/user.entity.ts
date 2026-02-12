import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationMember } from '../../organizations/entities/organization-member.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  ORGANIZER = 'organizer',
  PARTNER = 'partner',
  ADMIN = 'admin',
}

export enum AuthProvider {
  KAKAO = 'kakao',
  NAVER = 'naver',
  GOOGLE = 'google',
  APPLE = 'apple',
  EMAIL = 'email',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  WITHDRAWN = 'withdrawn',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 20 })
  role: UserRole;

  @Column({ name: 'auth_provider', type: 'varchar', length: 20 })
  authProvider: AuthProvider;

  @Column({ name: 'auth_provider_id', length: 255, nullable: true })
  authProviderId: string;

  @Column({ name: 'password_hash', length: 255, nullable: true, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ name: 'profile_image', length: 500, nullable: true })
  profileImage: string;

  @Column({ name: 'fcm_token', length: 500, nullable: true })
  fcmToken: string;

  @OneToMany(() => OrganizationMember, (member) => member.user)
  organizationMemberships: OrganizationMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
