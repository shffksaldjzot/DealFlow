import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
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
import { Notification, NotificationStatus } from '../notifications/entities/notification.entity';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { IcContract, IcContractStatus } from '../integrated-contracts/entities/ic-contract.entity';
import { IcConfig } from '../integrated-contracts/entities/ic-config.entity';
import {
  RejectOrganizerDto,
  ChangeUserStatusDto,
  UpdateUserDto,
  CreateUserDto,
  AdminUpdateEventDto,
  AdminUpdateContractStatusDto,
  AdminUpdateIcContractStatusDto,
  ResetPasswordDto,
} from './dto/approve-organizer.dto';
import { UpdateOrganizationDto } from '../organizations/dto/update-organization.dto';

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
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(IcContract)
    private readonly icContractRepository: Repository<IcContract>,
    @InjectRepository(IcConfig)
    private readonly icConfigRepository: Repository<IcConfig>,
    private readonly activityLogService: ActivityLogService,
    private readonly dataSource: DataSource,
  ) {}

  private get isPostgres(): boolean {
    return this.dataSource.options.type === 'postgres';
  }

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

  async getActivityLogs(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page, limit, search } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      queryBuilder.andWhere(
        `(log.description ${like} :search OR user.name ${like} :search)`,
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    const sanitized = data.map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      userId: log.userId,
      userName: log.user?.name || null,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    return new PaginatedResult(sanitized, total, page, limit);
  }

  // ─── Dashboard ────────────────────────────────────────

  async getDashboard(from?: string, to?: string): Promise<{
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
    passwordResetRequests: any[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build date range filter
    const dateFilter: any = {};
    if (from) dateFilter.createdAt = MoreThanOrEqual(new Date(from));
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt = to && from
        ? Between(new Date(from), toDate)
        : LessThanOrEqual(toDate);
    }
    const hasPeriod = from || to;

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
      this.orgRepository.count(hasPeriod ? { where: dateFilter } : {}),
      this.eventRepository.count(hasPeriod ? { where: dateFilter } : {}),
      this.contractRepository.count(hasPeriod ? { where: dateFilter } : {}),
      this.userRepository.count(hasPeriod ? { where: dateFilter } : {}),
      this.orgRepository.count({ where: { status: OrgStatus.PENDING, type: OrgType.ORGANIZER } }),
      this.orgRepository.count({ where: { status: OrgStatus.PENDING, type: OrgType.PARTNER } }),
      this.eventRepository.count({ where: { status: 'active' as any } }),
      this.userRepository.find({
        select: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
        where: hasPeriod ? dateFilter : undefined,
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.contractRepository.find({
        relations: ['event', 'partner'],
        where: hasPeriod ? dateFilter : undefined,
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    let signedContractsToday: number;
    if (hasPeriod) {
      const qb = this.contractRepository.createQueryBuilder('c')
        .where('c.signedAt IS NOT NULL');
      if (from) qb.andWhere('c.signedAt >= :from', { from: new Date(from) });
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        qb.andWhere('c.signedAt <= :to', { to: toDate });
      }
      signedContractsToday = await qb.getCount();
    } else {
      signedContractsToday = await this.contractRepository
        .createQueryBuilder('c')
        .where('c.signedAt >= :today', { today })
        .getCount();
    }

    const statusQb = this.contractRepository
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count');
    if (hasPeriod) {
      if (from) statusQb.where('c.createdAt >= :from', { from: new Date(from) });
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        statusQb[from ? 'andWhere' : 'where']('c.createdAt <= :to', { to: toDate });
      }
    }
    const statusCounts = await statusQb.groupBy('c.status').getRawMany();

    const contractsByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      contractsByStatus[row.status] = parseInt(row.count, 10);
    }

    // Get pending password reset requests
    const passwordResetRequests = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const pendingPasswordResets = passwordResetRequests.filter(
      (n) => n.metadata?.type === 'password_reset_request',
    );

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
      passwordResetRequests: pendingPasswordResets,
    };
  }

  // ─── Organizers ────────────────────────────────────────

  async listOrganizers(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Organization>> {
    const { page, limit, search, status } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orgRepository
      .createQueryBuilder('org')
      .leftJoinAndSelect('org.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .orderBy('org.status', 'ASC')
      .addOrderBy('org.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status && status !== 'all') {
      queryBuilder.andWhere('org.status = :status', { status });
    }

    if (search) {
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      queryBuilder.andWhere(`org.name ${like} :search`, {
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

    // Activate all member users of this org
    const members = await this.memberRepository.find({
      where: { organizationId: orgId },
    });
    for (const member of members) {
      await this.userRepository.update(
        { id: member.userId, status: UserStatus.PENDING },
        { status: UserStatus.ACTIVE },
      );
    }

    await this.activityLogService.log('approve_organizer', `주관사 "${org.name}" 승인`, adminUserId, 'organization', orgId);
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
    await this.activityLogService.log('reject_organizer', `주관사 "${org.name}" 거절: ${dto.reason}`, adminUserId, 'organization', orgId);
    return saved;
  }

  // ─── Users ────────────────────────────────────────

  async listUsers(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page, limit, search, role, status } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organizationMemberships', 'membership')
      .leftJoinAndSelect('membership.organization', 'org')
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
        'membership.id',
        'org.id',
        'org.status',
        'org.name',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (role && role !== 'all') {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status && status !== 'all') {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (search) {
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      queryBuilder.andWhere(
        `(user.name ${like} :search OR user.email ${like} :search)`,
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    // Compute effective status: partner/organizer with pending org → 'pending'
    const usersWithEffectiveStatus = data.map((u) => {
      const orgStatus = u.organizationMemberships?.[0]?.organization?.status;
      let effectiveStatus: string = u.status;
      if ((u.role === 'partner' || u.role === 'organizer') && orgStatus && orgStatus !== 'approved') {
        effectiveStatus = 'pending';
      }
      if ((u.role === 'partner' || u.role === 'organizer') && !u.organizationMemberships?.length) {
        effectiveStatus = 'pending';
      }
      const { organizationMemberships, passwordHash, ...rest } = u;
      return { ...rest, effectiveStatus, orgName: organizationMemberships?.[0]?.organization?.name || null };
    });

    return new PaginatedResult(usersWithEffectiveStatus, total, page, limit);
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
        'organization.representativeName',
        'organization.contactPhone',
        'organization.contactEmail',
        'organization.businessNumber',
        'organization.items',
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
    await this.activityLogService.log('update_user', `사용자 "${user.name}" 정보 수정`, adminUserId, 'user', userId);
    const { passwordHash, ...result } = saved;
    return result as Omit<User, 'passwordHash'>;
  }

  async updateOrganization(orgId: string, dto: UpdateOrganizationDto, adminUserId?: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('조직을 찾을 수 없습니다.');

    if (dto.name !== undefined) org.name = dto.name;
    if (dto.businessNumber !== undefined) org.businessNumber = dto.businessNumber;
    if (dto.businessLicenseFileId !== undefined) org.businessLicenseFileId = dto.businessLicenseFileId;
    if (dto.representativeName !== undefined) org.representativeName = dto.representativeName;
    if (dto.contactPhone !== undefined) org.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) org.contactEmail = dto.contactEmail;
    if (dto.emergencyEmail !== undefined) org.emergencyEmail = dto.emergencyEmail;
    if (dto.address !== undefined) org.address = dto.address;
    if (dto.items !== undefined) org.items = dto.items;

    const saved = await this.orgRepository.save(org);
    await this.activityLogService.log('update_organization', `업체 "${org.name}" 정보 수정 (관리자)`, adminUserId, 'organization', orgId);
    return saved;
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

      await this.activityLogService.log('create_organization', `관리자가 사용자 "${dto.name}" 조직 자동 생성`, adminUserId, 'organization', savedOrg.id);
    }

    await this.activityLogService.log('create_user', `관리자가 사용자 "${dto.name}" (${dto.email}) 계정 생성`, adminUserId, 'user', saved.id);
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
    await this.activityLogService.log('delete_user', `사용자 "${user.name}" 계정 삭제 (탈퇴 처리)`, adminUserId, 'user', userId);
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

    await this.activityLogService.log(
      'reset_password',
      `관리자가 사용자 "${user.name}" (${user.email}) 비밀번호 초기화`,
      adminUserId,
      'user',
      userId,
    );

    // Mark related password reset notifications as sent
    await this.notificationRepository
      .createQueryBuilder()
      .update()
      .set({ status: NotificationStatus.SENT, sentAt: new Date() })
      .where(
        this.isPostgres
          ? `metadata->>'targetUserId' = :userId`
          : `json_extract(metadata, '$.targetUserId') = :userId`,
        { userId },
      )
      .andWhere(
        this.isPostgres
          ? `metadata->>'type' = 'password_reset_request'`
          : `json_extract(metadata, '$.type') = 'password_reset_request'`,
      )
      .andWhere('status = :status', { status: NotificationStatus.PENDING })
      .execute();

    // Kakao Alimtalk stub - send temporary password to user
    if (user.phone) {
      await this.sendKakaoAlimtalk(
        user.phone,
        `[DealFlow] 비밀번호가 초기화되었습니다.\n임시 비밀번호: ${temporaryPassword}\n로그인 후 반드시 비밀번호를 변경해주세요.`,
      );
    }

    return { temporaryPassword };
  }

  private async sendKakaoAlimtalk(phone: string, message: string): Promise<void> {
    // TODO: Implement actual Kakao Alimtalk API integration
    // For now, log the message that would be sent
    console.log(`[KakaoAlimtalk] To: ${phone}, Message: ${message}`);
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '!';
  }

  async approveUser(userId: string, adminUserId?: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // Activate user
    user.status = UserStatus.ACTIVE;
    const saved = await this.userRepository.save(user);

    // Also approve user's organization if exists
    const membership = await this.memberRepository.findOne({ where: { userId } });
    if (membership) {
      const org = await this.orgRepository.findOne({ where: { id: membership.organizationId } });
      if (org && org.status === OrgStatus.PENDING) {
        org.status = OrgStatus.APPROVED;
        org.approvedAt = new Date();
        org.approvedBy = adminUserId;
        await this.orgRepository.save(org);
        await this.activityLogService.log('approve_organizer', `업체 "${org.name}" 승인 (사용자 승인)`, adminUserId, 'organization', org.id);
      }
    }

    await this.activityLogService.log('approve_user', `사용자 "${user.name}" (${user.email}) 가입 승인`, adminUserId, 'user', userId);
    const { passwordHash, ...result } = saved;
    return result as Omit<User, 'passwordHash'>;
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
    await this.activityLogService.log('change_user_status', `사용자 "${user.name}" 상태를 "${dto.status}"로 변경`, adminUserId, 'user', userId);
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
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      queryBuilder.andWhere(`event.name ${like} :search`, {
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
    await this.activityLogService.log('update_event', `행사 "${event.name}" 정보 수정`, adminUserId, 'event', eventId);
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
    await this.activityLogService.log('delete_event', `행사 "${event.name}" 삭제 (취소 처리)`, adminUserId, 'event', eventId);
  }

  // ─── Contracts ────────────────────────────────────────

  async listAllContracts(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Contract> & { totalAmount?: number }> {
    const { page, limit, search, startDate, endDate } = pagination;
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
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      queryBuilder.andWhere(`contract.contractNumber ${like} :search`, {
        search: `%${search}%`,
      });
    }

    if (startDate) {
      queryBuilder.andWhere('contract.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('contract.createdAt <= :endDate', { endDate: end });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    // Calculate totalAmount for filtered results
    const sumQb = this.contractRepository.createQueryBuilder('contract')
      .select('COALESCE(SUM(contract.totalAmount), 0)', 'sum');
    if (search) {
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      sumQb.andWhere(`contract.contractNumber ${like} :search`, { search: `%${search}%` });
    }
    if (startDate) {
      sumQb.andWhere('contract.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sumQb.andWhere('contract.createdAt <= :endDate', { endDate: end });
    }
    const sumResult = await sumQb.getRawOne();
    const totalAmount = Number(sumResult?.sum) || 0;

    const result = new PaginatedResult(data, total, page, limit);
    return { ...result, totalAmount };
  }

  async getContractDetail(contractId: string): Promise<any> {
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: [
        'event',
        'partner',
        'customer',
        'template',
        'template.fields',
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
    if (dto.status === ContractStatus.PENDING) {
      contract.signedAt = null;
      contract.completedAt = null;
      contract.cancelledAt = null;
      contract.cancelReason = null;
      contract.cancelledBy = null;
      // Delete signatures for clean re-test
      await this.signatureRepository.delete({ contractId: contract.id });
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

    await this.activityLogService.log(
      'update_contract_status',
      `계약 ${contract.contractNumber} 상태를 "${fromStatus}" → "${dto.status}"로 변경`,
      adminUserId,
      'contract',
      contractId,
    );

    return saved;
  }

  // ─── IC Contracts ────────────────────────────────────────

  async getIcContracts(pagination: PaginationDto): Promise<PaginatedResult<IcContract> & { totalAmount?: number }> {
    const { page, limit, search, startDate, endDate } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.icContractRepository
      .createQueryBuilder('ic')
      .leftJoinAndSelect('ic.config', 'config')
      .leftJoinAndSelect('config.event', 'event')
      .leftJoinAndSelect('ic.apartmentType', 'apartmentType')
      .orderBy('ic.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      queryBuilder.andWhere(
        `(ic.shortCode ${like} :search OR ic.customerName ${like} :search)`,
        { search: `%${search}%` },
      );
    }

    if (startDate) {
      queryBuilder.andWhere('ic.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('ic.createdAt <= :endDate', { endDate: end });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    // Calculate totalAmount for filtered results
    const sumQb = this.icContractRepository.createQueryBuilder('ic')
      .select('COALESCE(SUM(ic.totalAmount), 0)', 'sum');
    if (search) {
      const like = this.isPostgres ? 'ILIKE' : 'LIKE';
      sumQb.andWhere(`(ic.shortCode ${like} :search OR ic.customerName ${like} :search)`, { search: `%${search}%` });
    }
    if (startDate) {
      sumQb.andWhere('ic.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sumQb.andWhere('ic.createdAt <= :endDate', { endDate: end });
    }
    const sumResult = await sumQb.getRawOne();
    const totalAmount = Number(sumResult?.sum) || 0;

    const result = new PaginatedResult(data, total, page, limit);
    return { ...result, totalAmount };
  }

  async getIcContractDetail(id: string): Promise<IcContract> {
    const contract = await this.icContractRepository.findOne({
      where: { id },
      relations: ['config', 'config.event', 'apartmentType', 'customer'],
    });
    if (!contract) {
      throw new NotFoundException('통합 계약을 찾을 수 없습니다.');
    }
    return contract;
  }

  async updateIcContractStatus(
    id: string,
    dto: AdminUpdateIcContractStatusDto,
    adminUserId?: string,
  ): Promise<IcContract> {
    const contract = await this.icContractRepository.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException('통합 계약을 찾을 수 없습니다.');
    }

    const fromStatus = contract.status;
    contract.status = dto.status as IcContractStatus;

    const saved = await this.icContractRepository.save(contract);

    await this.activityLogService.log(
      'update_ic_contract_status',
      `통합 계약 ${contract.shortCode} 상태를 "${fromStatus}" → "${dto.status}"로 변경`,
      adminUserId,
      'ic_contract',
      id,
    );

    return saved;
  }
}
