import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import {
  EventPartner,
  EventPartnerStatus,
} from './entities/event-partner.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';
import { generateInviteCode } from '../../common/utils/code-generator';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventPartner)
    private readonly eventPartnerRepository: Repository<EventPartner>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
  ) {}

  private async getOrgIdForUser(userId: string): Promise<string> {
    const membership = await this.memberRepository.findOne({
      where: { userId },
    });
    if (!membership) {
      throw new ForbiddenException('소속된 조직이 없습니다.');
    }
    return membership.organizationId;
  }

  async create(userId: string, dto: CreateEventDto): Promise<Event> {
    const orgId = await this.getOrgIdForUser(userId);

    let inviteCode = generateInviteCode();
    // Ensure invite code is unique
    let existing = await this.eventRepository.findOne({
      where: { inviteCode },
    });
    while (existing) {
      inviteCode = generateInviteCode();
      existing = await this.eventRepository.findOne({
        where: { inviteCode },
      });
    }

    const event = this.eventRepository.create({
      organizerId: orgId,
      name: dto.name,
      description: dto.description,
      venue: dto.venue,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isPrivate: dto.isPrivate ?? true,
      commissionRate: dto.commissionRate ?? 0,
      inviteCode,
      status: EventStatus.DRAFT,
    });

    const saved = await this.eventRepository.save(event);
    return this.eventRepository.findOne({
      where: { id: saved.id },
      relations: ['organizer'],
    });
  }

  async listMyEvents(userId: string): Promise<Event[]> {
    const orgId = await this.getOrgIdForUser(userId);

    return this.eventRepository.find({
      where: { organizerId: orgId },
      relations: ['organizer', 'partners'],
      order: { createdAt: 'DESC' },
    });
  }

  async getEventDetail(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'partners', 'partners.partner'],
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    // Check access: organizer org member or partner org member
    const orgId = await this.getOrgIdForUser(userId);
    const isOrganizer = event.organizerId === orgId;
    const isPartner = event.partners.some((p) => p.partnerId === orgId);

    if (!isOrganizer && !isPartner) {
      throw new ForbiddenException('이벤트에 대한 접근 권한이 없습니다.');
    }

    return event;
  }

  async updateEvent(
    eventId: string,
    userId: string,
    dto: UpdateEventDto,
  ): Promise<Event> {
    const orgId = await this.getOrgIdForUser(userId);
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizerId: orgId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없거나 수정 권한이 없습니다.');
    }

    if (dto.name !== undefined) event.name = dto.name;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.venue !== undefined) event.venue = dto.venue;
    if (dto.startDate !== undefined) event.startDate = dto.startDate;
    if (dto.endDate !== undefined) event.endDate = dto.endDate;
    if (dto.isPrivate !== undefined) event.isPrivate = dto.isPrivate;
    if (dto.commissionRate !== undefined) event.commissionRate = dto.commissionRate;

    return this.eventRepository.save(event);
  }

  async updateEventStatus(
    eventId: string,
    userId: string,
    dto: UpdateEventStatusDto,
  ): Promise<Event> {
    const orgId = await this.getOrgIdForUser(userId);
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizerId: orgId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없거나 상태 변경 권한이 없습니다.');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      [EventStatus.DRAFT]: [EventStatus.ACTIVE, EventStatus.CANCELLED],
      [EventStatus.ACTIVE]: [EventStatus.CLOSED, EventStatus.CANCELLED],
      [EventStatus.CLOSED]: [],
      [EventStatus.CANCELLED]: [],
    };

    if (!validTransitions[event.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `'${event.status}' 상태에서 '${dto.status}' 상태로 변경할 수 없습니다.`,
      );
    }

    event.status = dto.status;
    return this.eventRepository.save(event);
  }

  async listPartners(eventId: string, userId: string): Promise<EventPartner[]> {
    const orgId = await this.getOrgIdForUser(userId);
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizerId: orgId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없거나 접근 권한이 없습니다.');
    }

    return this.eventPartnerRepository.find({
      where: { eventId },
      relations: ['partner'],
      order: { createdAt: 'DESC' },
    });
  }

  async updatePartnerStatus(
    eventId: string,
    partnerId: string,
    userId: string,
    dto: UpdatePartnerStatusDto,
  ): Promise<EventPartner> {
    const orgId = await this.getOrgIdForUser(userId);
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizerId: orgId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없거나 권한이 없습니다.');
    }

    const eventPartner = await this.eventPartnerRepository.findOne({
      where: { eventId, partnerId },
      relations: ['partner'],
    });
    if (!eventPartner) {
      throw new NotFoundException('해당 파트너를 찾을 수 없습니다.');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      [EventPartnerStatus.PENDING]: [EventPartnerStatus.APPROVED, EventPartnerStatus.REJECTED],
      [EventPartnerStatus.APPROVED]: [EventPartnerStatus.CANCELLED],
      [EventPartnerStatus.REJECTED]: [],
      [EventPartnerStatus.CANCELLED]: [],
    };

    if (!validTransitions[eventPartner.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `'${eventPartner.status}' 상태에서 '${dto.status}' 상태로 변경할 수 없습니다.`,
      );
    }

    eventPartner.status = dto.status;
    if (dto.commissionRate !== undefined) {
      eventPartner.commissionRate = dto.commissionRate;
    }
    if (dto.status === EventPartnerStatus.APPROVED) {
      eventPartner.approvedAt = new Date();
    }
    if (dto.status === EventPartnerStatus.CANCELLED) {
      eventPartner.cancelledAt = new Date();
      eventPartner.cancelledBy = userId;
      eventPartner.cancelReason = dto.cancelReason || null;
    }

    return this.eventPartnerRepository.save(eventPartner);
  }

  async getPublicEventInfo(inviteCode: string): Promise<{
    name: string;
    description?: string;
    venue?: string;
    startDate: string;
    endDate: string;
    organizerName: string;
    status: string;
  }> {
    const event = await this.eventRepository.findOne({
      where: { inviteCode },
      relations: ['organizer'],
    });
    if (!event) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }

    return {
      name: event.name,
      description: event.description,
      venue: event.venue,
      startDate: event.startDate,
      endDate: event.endDate,
      organizerName: event.organizer?.name || '',
      status: event.status,
    };
  }

  async getContractsSummary(
    eventId: string,
    userId: string,
  ): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    contracts: Contract[];
  }> {
    const orgId = await this.getOrgIdForUser(userId);

    // Verify access (organizer or partner)
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    const isOrganizer = event.organizerId === orgId;
    if (!isOrganizer) {
      const partnerLink = await this.eventPartnerRepository.findOne({
        where: { eventId, partnerId: orgId },
      });
      if (!partnerLink) {
        throw new ForbiddenException('이벤트에 대한 접근 권한이 없습니다.');
      }
    }

    const contracts = await this.contractRepository.find({
      where: { eventId },
      relations: ['customer', 'partner', 'template'],
      order: { createdAt: 'DESC' },
    });

    const byStatus: Record<string, number> = {};
    let totalAmount = 0;

    for (const contract of contracts) {
      byStatus[contract.status] = (byStatus[contract.status] || 0) + 1;
      if (contract.totalAmount) {
        totalAmount += Number(contract.totalAmount);
      }
    }

    return {
      total: contracts.length,
      byStatus,
      totalAmount,
      contracts,
    };
  }
}
