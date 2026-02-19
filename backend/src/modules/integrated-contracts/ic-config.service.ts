import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IcConfig, IcConfigStatus } from './entities/ic-config.entity';
import { IcApartmentType } from './entities/ic-apartment-type.entity';
import { Event } from '../events/entities/event.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization, OrgStatus } from '../organizations/entities/organization.entity';
import { CreateIcConfigDto } from './dto/create-ic-config.dto';
import { UpdateIcConfigDto } from './dto/update-ic-config.dto';
import { CreateApartmentTypeDto } from './dto/create-apartment-type.dto';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';

@Injectable()
export class IcConfigService {
  constructor(
    @InjectRepository(IcConfig)
    private readonly configRepository: Repository<IcConfig>,
    @InjectRepository(IcApartmentType)
    private readonly apartmentTypeRepository: Repository<IcApartmentType>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private async getOrgIdForUser(userId: string, requireApproved = false): Promise<string> {
    const membership = await this.memberRepository.findOne({
      where: { userId },
    });
    if (!membership) {
      throw new ForbiddenException('소속된 조직이 없습니다.');
    }
    if (requireApproved) {
      const org = await this.orgRepository.findOne({
        where: { id: membership.organizationId },
      });
      if (!org || org.status !== OrgStatus.APPROVED) {
        throw new ForbiddenException('조직이 아직 승인되지 않았습니다.');
      }
    }
    return membership.organizationId;
  }

  private async verifyOrganizerAccess(eventId: string, userId: string): Promise<Event> {
    const orgId = await this.getOrgIdForUser(userId, true);
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }
    if (event.organizerId !== orgId) {
      throw new ForbiddenException('해당 행사의 주관사만 설정할 수 있습니다.');
    }
    return event;
  }

  async create(userId: string, dto: CreateIcConfigDto): Promise<IcConfig> {
    await this.verifyOrganizerAccess(dto.eventId, userId);

    const existing = await this.configRepository.findOne({
      where: { eventId: dto.eventId },
    });
    if (existing) {
      throw new ConflictException('해당 행사의 통합 계약 설정이 이미 존재합니다.');
    }

    const config = this.configRepository.create({
      eventId: dto.eventId,
      paymentStages: dto.paymentStages || [],
      legalTerms: dto.legalTerms || null,
      specialNotes: dto.specialNotes || null,
    });

    const saved = await this.configRepository.save(config);

    await this.activityLogService.log(
      'create_ic_config',
      `통합 계약 설정 생성`,
      userId,
      'ic_config',
      saved.id,
    );

    return this.findOneById(saved.id);
  }

  async findByEventId(eventId: string): Promise<IcConfig> {
    const config = await this.configRepository.findOne({
      where: { eventId },
      relations: ['apartmentTypes', 'event'],
    });
    if (!config) {
      throw new NotFoundException('해당 행사의 통합 계약 설정을 찾을 수 없습니다.');
    }
    return config;
  }

  async findOneById(id: string): Promise<IcConfig> {
    const config = await this.configRepository.findOne({
      where: { id },
      relations: ['apartmentTypes', 'event'],
    });
    if (!config) {
      throw new NotFoundException('통합 계약 설정을 찾을 수 없습니다.');
    }
    return config;
  }

  async update(id: string, userId: string, dto: UpdateIcConfigDto): Promise<IcConfig> {
    const config = await this.findOneById(id);
    await this.verifyOrganizerAccess(config.eventId, userId);

    if (dto.paymentStages !== undefined) config.paymentStages = dto.paymentStages;
    if (dto.legalTerms !== undefined) config.legalTerms = dto.legalTerms;
    if (dto.specialNotes !== undefined) config.specialNotes = dto.specialNotes;
    if (dto.status !== undefined) config.status = dto.status;

    await this.configRepository.save(config);
    return this.findOneById(id);
  }

  async addApartmentType(
    configId: string,
    userId: string,
    dto: CreateApartmentTypeDto,
  ): Promise<IcApartmentType> {
    const config = await this.findOneById(configId);
    await this.verifyOrganizerAccess(config.eventId, userId);

    const apartmentType = this.apartmentTypeRepository.create({
      configId,
      name: dto.name,
      floorPlanFileId: dto.floorPlanFileId || null,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.apartmentTypeRepository.save(apartmentType);
  }

  async updateApartmentType(
    configId: string,
    typeId: string,
    userId: string,
    dto: Partial<CreateApartmentTypeDto>,
  ): Promise<IcApartmentType> {
    const config = await this.findOneById(configId);
    await this.verifyOrganizerAccess(config.eventId, userId);

    const apartmentType = await this.apartmentTypeRepository.findOne({
      where: { id: typeId, configId },
    });
    if (!apartmentType) {
      throw new NotFoundException('아파트 타입을 찾을 수 없습니다.');
    }

    if (dto.name !== undefined) apartmentType.name = dto.name;
    if (dto.floorPlanFileId !== undefined) apartmentType.floorPlanFileId = dto.floorPlanFileId;
    if (dto.sortOrder !== undefined) apartmentType.sortOrder = dto.sortOrder;

    return this.apartmentTypeRepository.save(apartmentType);
  }

  async deleteApartmentType(
    configId: string,
    typeId: string,
    userId: string,
  ): Promise<void> {
    const config = await this.findOneById(configId);
    await this.verifyOrganizerAccess(config.eventId, userId);

    const apartmentType = await this.apartmentTypeRepository.findOne({
      where: { id: typeId, configId },
    });
    if (!apartmentType) {
      throw new NotFoundException('아파트 타입을 찾을 수 없습니다.');
    }

    await this.apartmentTypeRepository.remove(apartmentType);
  }
}
