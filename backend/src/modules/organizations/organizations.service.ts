import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, OrgStatus } from './entities/organization.entity';
import {
  OrganizationMember,
  MemberRole,
} from './entities/organization-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(
    userId: string,
    dto: CreateOrganizationDto,
  ): Promise<Organization> {
    const organization = this.orgRepository.create({
      type: dto.type,
      name: dto.name,
      businessNumber: dto.businessNumber,
      businessLicenseFileId: dto.businessLicenseFileId,
      representativeName: dto.representativeName,
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail,
      address: dto.address,
      items: dto.items || null,
      status: OrgStatus.PENDING,
    });

    const savedOrg = await this.orgRepository.save(organization);

    // Create membership linking the creator as owner
    const membership = this.memberRepository.create({
      organizationId: savedOrg.id,
      userId,
      role: MemberRole.OWNER,
    });
    await this.memberRepository.save(membership);

    await this.activityLogService.log(
      'register_organization',
      `업체 "${dto.name}" 등록 신청 (${dto.type})`,
      userId,
      'organization',
      savedOrg.id,
    );

    return this.orgRepository.findOne({
      where: { id: savedOrg.id },
      relations: ['members', 'members.user'],
    });
  }

  async getMyOrganization(userId: string): Promise<Organization> {
    const membership = await this.memberRepository.findOne({
      where: { userId },
      relations: ['organization', 'organization.members', 'organization.members.user'],
    });

    if (!membership) {
      throw new NotFoundException('소속된 조직이 없습니다.');
    }

    return membership.organization;
  }

  async update(
    orgId: string,
    userId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id: orgId },
    });
    if (!org) {
      throw new NotFoundException('조직을 찾을 수 없습니다.');
    }

    // Verify user is a member with appropriate role
    const membership = await this.memberRepository.findOne({
      where: { organizationId: orgId, userId },
    });
    if (!membership || membership.role === MemberRole.MEMBER) {
      throw new ForbiddenException('조직 정보를 수정할 권한이 없습니다.');
    }

    if (dto.name !== undefined) org.name = dto.name;
    if (dto.businessNumber !== undefined) org.businessNumber = dto.businessNumber;
    if (dto.businessLicenseFileId !== undefined)
      org.businessLicenseFileId = dto.businessLicenseFileId;
    if (dto.representativeName !== undefined)
      org.representativeName = dto.representativeName;
    if (dto.contactPhone !== undefined) org.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) org.contactEmail = dto.contactEmail;
    if (dto.address !== undefined) org.address = dto.address;
    if (dto.items !== undefined) org.items = dto.items;

    return this.orgRepository.save(org);
  }

  async getMembers(orgId: string, userId: string): Promise<OrganizationMember[]> {
    // Verify user belongs to this org
    const membership = await this.memberRepository.findOne({
      where: { organizationId: orgId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('이 조직의 멤버가 아닙니다.');
    }

    return this.memberRepository.find({
      where: { organizationId: orgId },
      relations: ['user'],
    });
  }

  async addMember(
    orgId: string,
    userId: string,
    dto: AddMemberDto,
  ): Promise<OrganizationMember> {
    // Verify requester has permission (owner or admin)
    const requesterMembership = await this.memberRepository.findOne({
      where: { organizationId: orgId, userId },
    });
    if (
      !requesterMembership ||
      requesterMembership.role === MemberRole.MEMBER
    ) {
      throw new ForbiddenException('멤버를 추가할 권한이 없습니다.');
    }

    // Find the invited user by email
    const invitedUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!invitedUser) {
      throw new NotFoundException(
        '해당 이메일의 사용자를 찾을 수 없습니다. 먼저 회원가입이 필요합니다.',
      );
    }

    // Check if already a member
    const existing = await this.memberRepository.findOne({
      where: { organizationId: orgId, userId: invitedUser.id },
    });
    if (existing) {
      throw new ConflictException('이미 조직에 소속된 사용자입니다.');
    }

    const membership = this.memberRepository.create({
      organizationId: orgId,
      userId: invitedUser.id,
      role: dto.role || MemberRole.MEMBER,
    });

    const saved = await this.memberRepository.save(membership);
    return this.memberRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
  }

  async findById(orgId: string): Promise<Organization | null> {
    return this.orgRepository.findOne({
      where: { id: orgId },
      relations: ['members'],
    });
  }

  async getUserOrganizationId(userId: string): Promise<string | null> {
    const membership = await this.memberRepository.findOne({
      where: { userId },
    });
    return membership?.organizationId || null;
  }
}
