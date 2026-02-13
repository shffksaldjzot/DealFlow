import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus, AuthProvider } from '../users/entities/user.entity';
import {
  Organization,
  OrgStatus,
  OrgType,
} from '../organizations/entities/organization.entity';
import { OrganizationMember, MemberRole } from '../organizations/entities/organization-member.entity';
import { Event } from '../events/entities/event.entity';
import { Contract, ContractStatus } from '../contracts/entities/contract.entity';
import { ContractFieldValue } from '../contracts/entities/contract-field-value.entity';
import { ContractSignature } from '../contracts/entities/contract-signature.entity';
import { ContractHistory } from '../contracts/entities/contract-history.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import {
  RejectOrganizerDto,
  ChangeUserStatusDto,
  UpdateUserDto,
  CreateUserDto,
  AdminUpdateEventDto,
  AdminUpdateContractStatusDto,
  ResetPasswordDto,
} from './dto/approve-organizer.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ContractFieldValue)
    private readonly fieldValueRepository: Repository<ContractFieldValue>,
    @InjectRepository(ContractSignature)
    private readonly signatureRepository: Repository<ContractSignature>,
    @InjectRepository(ContractHistory)
    private readonly historyRepository: Repository<ContractHistory>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  // ─── Activity Log ────────────────────────────────────────

  async logActivity(
    action: string,
    description: string,
    userId?: string,
    targetType?: string,
    targetId?: string,
    metadata?: any,
  ): Promise<ActivityLog> {
    const log = this.activityLogRepository.create({
      action,
      description,
      userId: userId || null,
      targetType: targetType || null,
      targetId: targetId || null,
      metadata: metadata || null,
    });
    return this.activityLogRepository.save(log);
  }

  async getActivityLogs(pagination: PaginationDto): Promise<PaginatedResult<ActivityLog>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await this.activityLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return new PaginatedResult(data, total, page, limit);
  }

  // ─── Dashboard ────────────────────────────────────────

  async getDashboard(): Promise<{
    totalOrganizations: number;
    totalEvents: number;
    totalContracts: number;
    totalUsers: number;
    pendingOrganizations: number;
    pendingPartners: number;
    activeEvents: number;
    signedContractsToday: number;
    contractsByStatus: Record<string, number>;
    recentUsers: any[];
    recentContracts: any[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrganizations,
      totalEvents,
      totalContracts,
      totalUsers,
      pendingOrganizations,
      pendingPartners,
      activeEvents,
      recentUsers,
      recentContracts,
    ] = await Promise.all([
      this.orgRepository.count(),
      this.eventRepository.count(),
      this.contractRepository.count(),
      this.userRepository.count(),
      this.orgRepository.count({ where: { status: OrgStatus.PENDING, type: OrgType.ORGANIZER } }),
      this.orgRepository.count({ where: { status: OrgStatus.PENDING, type: OrgType.PARTNER } }),
      this.eventRepository.count({ where: { status: 'active' as any } }),
      this.userRepository.find({
        select: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.contractRepository.find({
        relations: ['event', 'partner'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    const signedContractsToday = await this.contractRepository
      .createQueryBuilder('c')
      .where('c.signedAt >= :today', { today })
      .getCount();

    const statusCounts = await this.contractRepository
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany();

    const contractsByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      contractsByStatus[row.status] = parseInt(row.count, 10);
    }

    return {
      totalOrganizations,
      totalEvents,
      totalContracts,
      totalUsers,
      pendingOrganizations,
      pendingPartners,
      activeEvents,
      signedContractsToday,
      contractsByStatus,
      recentUsers,
      recentContracts,
    };
  }

  // ─── Organizers ────────────────────────────────────────

  async listOrganizers(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Organization>> {
    const { page, limit, search } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orgRepository
      .createQueryBuilder('org')
      .leftJoinAndSelect('org.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .where('org.type = :type', { type: OrgType.ORGANIZER })
      .orderBy('org.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('org.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return new PaginatedResult(data, total, page, limit);
  }

  async approveOrganizer(orgId: string, adminUserId: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id: orgId },
    });
    if (!org) {
      throw new NotFoundException('조직을 찾을 수 없습니다.');
    }

    org.status = OrgStatus.APPROVED;
    org.approvedAt = new Date();
    org.approvedBy = adminUserId;
    org.rejectionReason = null;

    const saved = await this.orgRepository.save(org);
    await this.logActivity('approve_organizer', `주관사 "${org.name}" 승인`, adminUserId, 'organization', orgId);
    return saved;
  }

  async rejectOrganizer(
    orgId: string,
    adminUserId: string,
    dto: RejectOrganizerDto,
  ): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id: orgId },
    });
    if (!org) {
      throw new NotFoundException('조직을 찾을 수 없습니다.');
    }

    org.status = OrgStatus.REJECTED;
    org.rejectionReason = dto.reason;
    org.approvedBy = adminUserId;

    const saved = await this.orgRepository.save(org);
    await this.logActivity('reject_organizer', `주관사 "${org.name}" 거절: ${dto.reason}`, adminUserId, 'organization', orgId);
    return saved;
  }

  // ─── Users ────────────────────────────────────────

  async listUsers(pagination: PaginationDto): Promise<PaginatedResult<Omit<User, 'passwordHash'>>> {
    const { page, limit, search } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.phone',
        'user.role',
        'user.authProvider',
        'user.status',
        'user.address',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return new PaginatedResult(data, total, page, limit);
  }

  async getUserDetail(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'phone', 'role', 'authProvider', 'status', 'address', 'createdAt', 'updatedAt'],
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const memberships = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organizationMemberships', 'membership')
      .leftJoinAndSelect('membership.organization', 'organization')
      .where('user.id = :userId', { userId })
      .select([
        'user.id',
        'membership.id',
        'membership.role',
        'membership.joinedAt',
        'organization.id',
        'organization.name',
        'organization.type',
        'organization.status',
      ])
      .getOne();

    return {
      ...user,
      organizationMemberships: memberships?.organizationMemberships || [],
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto, adminUserId?: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role as UserRole;
    if (dto.status !== undefined) user.status = dto.status as UserStatus;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const saved = await this.userRepository.save(user);
    await this.logActivity('update_user', `사용자 "${user.name}" 정보 수정`, adminUserId, 'user', userId);
    const { passwordHash, ...result } = saved;
    return result as Omit<User, 'passwordHash'>;
  }

  async createUser(dto: CreateUserDto, adminUserId?: string): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      role: dto.role as UserRole,
      authProvider: AuthProvider.EMAIL,
      passwordHash,
      status: UserStatus.ACTIVE,
    });

    const saved = await this.userRepository.save(user);

    // Auto-create organization and membership for organizer/partner roles
    if (dto.role === 'organizer' || dto.role === 'partner') {
      const orgType = dto.role === 'organizer' ? OrgType.ORGANIZER : OrgType.PARTNER;
      const org = this.orgRepository.create({
        type: orgType,
        name: `${dto.name}`,
        businessNumber: '0000000000',
        status: OrgStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: adminUserId,
      });
      const savedOrg = await this.orgRepository.save(org);

      const membership = this.memberRepository.create({
        organizationId: savedOrg.id,
        userId: saved.id,
        role: MemberRole.OWNER,
      });
      await this.memberRepository.save(membership);

      await this.logActivity('create_organization', `관리자가 사용자 "${dto.name}" 조직 자동 생성`, adminUserId, 'organization', savedOrg.id);
    }

    await this.logActivity('create_user', `관리자가 사용자 "${dto.name}" (${dto.email}) 계정 생성`, adminUserId, 'user', saved.id);
    const { passwordHash: _, ...result } = saved;
    return result as Omit<User, 'passwordHash'>;
  }

  async deleteUser(userId: string, adminUserId?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.status = UserStatus.WITHDRAWN;
    await this.userRepository.save(user);
    await this.logActivity('delete_user', `사용자 "${user.name}" 계정 삭제 (탈퇴 처리)`, adminUserId, 'user', userId);
  }

  async resetPassword(
    userId: string,
    dto: ResetPasswordDto,
    adminUserId?: string,
  ): Promise<{ temporaryPassword: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Generate or use provided password
    const temporaryPassword = dto.newPassword || this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ passwordHash })
      .where('id = :id', { id: userId })
      .execute();

    await this.logActivity(
      'reset_password',
      `관리자가 사용자 "${user.name}" (${user.email}) 비밀번호 초기화`,
      adminUserId,
      'user',
      userId,
    );

    return { temporaryPassword };
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '!';
  }

  async changeUserStatus(
    userId: string,
    dto: ChangeUserStatusDto,
    adminUserId?: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.status = dto.status as UserStatus;
    const saved = await this.userRepository.save(user);
    await this.logActivity('change_user_status', `사용자 "${user.name}" 상태를 "${dto.status}"로 변경`, adminUserId, 'user', userId);
    const { passwordHash, ...result } = saved;
    return result as Omit<User, 'passwordHash'>;
  }

  // ─── Events ────────────────────────────────────────

  async listAllEvents(pagination: PaginationDto): Promise<PaginatedResult<Event>> {
    const { page, limit, search } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .orderBy('event.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('event.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return new PaginatedResult(data, total, page, limit);
  }

  async getEventDetail(eventId: string): Promise<any> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'partners', 'partners.partner'],
    });
    if (!event) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }

    const contracts = await this.contractRepository.find({
      where: { eventId },
      relations: ['partner', 'customer'],
      order: { createdAt: 'DESC' },
    });

    return { ...event, contracts };
  }

  async updateEvent(eventId: string, dto: AdminUpdateEventDto, adminUserId?: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }

    if (dto.name !== undefined) event.name = dto.name;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.status !== undefined) event.status = dto.status as any;

    const saved = await this.eventRepository.save(event);
    await this.logActivity('update_event', `행사 "${event.name}" 정보 수정`, adminUserId, 'event', eventId);
    return saved;
  }

  async deleteEvent(eventId: string, adminUserId?: string): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }

    event.status = 'cancelled' as any;
    await this.eventRepository.save(event);
    await this.logActivity('delete_event', `행사 "${event.name}" 삭제 (취소 처리)`, adminUserId, 'event', eventId);
  }

  // ─── Contracts ────────────────────────────────────────

  async listAllContracts(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Contract>> {
    const { page, limit, search } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.event', 'event')
      .leftJoinAndSelect('contract.partner', 'partner')
      .leftJoinAndSelect('contract.template', 'template')
      .leftJoinAndSelect('contract.customer', 'customer')
      .orderBy('contract.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('contract.contractNumber LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return new PaginatedResult(data, total, page, limit);
  }

  async getContractDetail(contractId: string): Promise<any> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: [
        'event',
        'partner',
        'customer',
        'template',
        'fieldValues',
        'fieldValues.field',
        'signatures',
        'histories',
      ],
    });
    if (!contract) {
      throw new NotFoundException('계약을 찾을 수 없습니다.');
    }
    return contract;
  }

  async updateContractStatus(
    contractId: string,
    dto: AdminUpdateContractStatusDto,
    adminUserId?: string,
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('계약을 찾을 수 없습니다.');
    }

    const fromStatus = contract.status;
    contract.status = dto.status as ContractStatus;

    if (dto.status === ContractStatus.COMPLETED) {
      contract.completedAt = new Date();
    }
    if (dto.status === ContractStatus.CANCELLED) {
      contract.cancelledAt = new Date();
      contract.cancelReason = dto.reason || '관리자에 의한 취소';
    }

    const saved = await this.contractRepository.save(contract);

    await this.historyRepository.save(
      this.historyRepository.create({
        contractId: saved.id,
        fromStatus,
        toStatus: dto.status,
        changedBy: adminUserId || null,
        reason: dto.reason || '관리자에 의한 상태 변경',
      }),
    );

    await this.logActivity(
      'update_contract_status',
      `계약 ${contract.contractNumber} 상태를 "${fromStatus}" → "${dto.status}"로 변경`,
      adminUserId,
      'contract',
      contractId,
    );

    return saved;
  }
}
