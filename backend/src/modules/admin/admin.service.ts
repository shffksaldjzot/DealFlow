import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import {
  Organization,
  OrgStatus,
  OrgType,
} from '../organizations/entities/organization.entity';
import { Event } from '../events/entities/event.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { RejectOrganizerDto, ChangeUserStatusDto } from './dto/approve-organizer.dto';

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
  ) {}

  async getDashboard(): Promise<{
    totalOrganizations: number;
    totalEvents: number;
    totalContracts: number;
    totalUsers: number;
    pendingOrganizations: number;
    activeEvents: number;
  }> {
    const [
      totalOrganizations,
      totalEvents,
      totalContracts,
      totalUsers,
      pendingOrganizations,
      activeEvents,
    ] = await Promise.all([
      this.orgRepository.count(),
      this.eventRepository.count(),
      this.contractRepository.count(),
      this.userRepository.count(),
      this.orgRepository.count({ where: { status: OrgStatus.PENDING } }),
      this.eventRepository.count({ where: { status: 'active' as any } }),
    ]);

    return {
      totalOrganizations,
      totalEvents,
      totalContracts,
      totalUsers,
      pendingOrganizations,
      activeEvents,
    };
  }

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

    return this.orgRepository.save(org);
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

    return this.orgRepository.save(org);
  }

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

  async changeUserStatus(
    userId: string,
    dto: ChangeUserStatusDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.status = dto.status as UserStatus;
    const saved = await this.userRepository.save(user);
    const { passwordHash, ...result } = saved;
    return result as Omit<User, 'passwordHash'>;
  }

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
}
