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
import { Organization, OrgStatus } from '../organizations/entities/organization.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';
import { generateInviteCode } from '../../common/utils/code-generator';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';

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
        throw new ForbiddenException('조직이 아직 승인되지 않았습니다. 관리자 승인 후 이용 가능합니다.');
      }
    }

    return membership.organizationId;
  }

  async create(userId: string, dto: CreateEventDto): Promise<Event> {
    const orgId = await this.getOrgIdForUser(userId, true);

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

    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    const orgName = org?.name || '주관사';

    await this.activityLogService.log(
      'create_event',
      `"${orgName}"이(가) 행사 "${dto.name}" 생성`,
      userId,
      'event',
      saved.id,
    );

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

    const fromStatus = event.status;
    event.status = dto.status;
    const saved = await this.eventRepository.save(event);

    const statusOrg = await this.orgRepository.findOne({ where: { id: orgId } });
    const statusOrgName = statusOrg?.name || '주관사';

    await this.activityLogService.log(
      'update_event_status',
      `"${statusOrgName}"이(가) 행사 "${event.name}" 상태 변경: "${fromStatus}" → "${dto.status}"`,
      userId,
      'event',
      eventId,
    );

    return saved;
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

    const saved = await this.eventPartnerRepository.save(eventPartner);

    const actionMap: Record<string, string> = {
      [EventPartnerStatus.APPROVED]: 'approve_partner',
      [EventPartnerStatus.REJECTED]: 'reject_partner',
      [EventPartnerStatus.CANCELLED]: 'cancel_partner',
    };
    const organizerOrg = await this.orgRepository.findOne({ where: { id: orgId } });
    const organizerName = organizerOrg?.name || '주관사';
    const partnerOrgName = eventPartner.partner?.name || partnerId;

    const statusLabels: Record<string, string> = {
      [EventPartnerStatus.APPROVED]: '승인',
      [EventPartnerStatus.REJECTED]: '거절',
      [EventPartnerStatus.CANCELLED]: '취소',
    };

    await this.activityLogService.log(
      actionMap[dto.status] || 'update_partner_status',
      `"${organizerName}"이(가) "${partnerOrgName}" 행사 "${event.name}" 참가 ${statusLabels[dto.status] || dto.status}`,
      userId,
      'event_partner',
      eventPartner.id,
    );

    return saved;
  }

  async deleteEvent(eventId: string, userId: string): Promise<void> {
    const orgId = await this.getOrgIdForUser(userId);
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizerId: orgId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없거나 삭제 권한이 없습니다.');
    }

    event.status = EventStatus.CANCELLED;
    await this.eventRepository.save(event);

    const delOrg = await this.orgRepository.findOne({ where: { id: orgId } });
    const delOrgName = delOrg?.name || '주관사';

    await this.activityLogService.log(
      'delete_event',
      `"${delOrgName}"이(가) 행사 "${event.name}" 삭제 (취소 처리)`,
      userId,
      'event',
      eventId,
    );
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

  async getSettlement(
    eventId: string,
    userId: string,
  ): Promise<{
    partners: Array<{
      partnerId: string;
      partnerName: string;
      items: string | null;
      contractCount: { total: number; pending: number; inProgress: number; signed: number; completed: number; cancelled: number };
      totalAmount: number;
      settledAmount: number;
      commissionRate: number;
      commissionAmount: number;
      payoutAmount: number;
      contracts: Contract[];
    }>;
    totals: {
      contractCount: number;
      totalAmount: number;
      settledAmount: number;
      totalCommission: number;
      totalPayout: number;
    };
    eventCommissionRate: number;
  }> {
    const orgId = await this.getOrgIdForUser(userId);
    const event = await this.eventRepository.findOne({
      where: { id: eventId, organizerId: orgId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없거나 접근 권한이 없습니다.');
    }

    const eventPartners = await this.eventPartnerRepository.find({
      where: { eventId },
      relations: ['partner'],
    });

    const contracts = await this.contractRepository.find({
      where: { eventId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });

    const statusCountInit = () => ({ total: 0, pending: 0, inProgress: 0, signed: 0, completed: 0, cancelled: 0 });
    const statusKeyMap: Record<string, keyof ReturnType<typeof statusCountInit>> = {
      pending: 'pending',
      in_progress: 'inProgress',
      signed: 'signed',
      completed: 'completed',
      cancelled: 'cancelled',
    };

    const partnerMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      items: string | null;
      contractCount: ReturnType<typeof statusCountInit>;
      totalAmount: number;
      settledAmount: number;
      commissionRate: number;
      contracts: Contract[];
    }>();

    for (const ep of eventPartners) {
      partnerMap.set(ep.partnerId, {
        partnerId: ep.partnerId,
        partnerName: ep.partner?.name || '업체',
        items: ep.items || ep.partner?.items || null,
        contractCount: statusCountInit(),
        totalAmount: 0,
        settledAmount: 0,
        commissionRate: ep.commissionRate != null ? Number(ep.commissionRate) : Number(event.commissionRate),
        contracts: [],
      });
    }

    for (const contract of contracts) {
      const entry = partnerMap.get(contract.partnerId);
      if (!entry) continue;

      const key = statusKeyMap[contract.status];
      if (key) entry.contractCount[key]++;
      entry.contractCount.total++;
      entry.contracts.push(contract);

      if (contract.status === 'cancelled') continue;
      const amount = Number(contract.totalAmount || 0);
      entry.totalAmount += amount;

      if (contract.status === 'signed' || contract.status === 'completed') {
        entry.settledAmount += amount;
      }
    }

    const partners = Array.from(partnerMap.values()).map((p) => {
      const commissionAmount = Math.round(p.settledAmount * p.commissionRate / 100);
      return {
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        items: p.items,
        contractCount: p.contractCount,
        totalAmount: p.totalAmount,
        settledAmount: p.settledAmount,
        commissionRate: p.commissionRate,
        commissionAmount,
        payoutAmount: p.settledAmount - commissionAmount,
        contracts: p.contracts,
      };
    });

    const totals = {
      contractCount: partners.reduce((sum, p) => sum + p.contractCount.total, 0),
      totalAmount: partners.reduce((sum, p) => sum + p.totalAmount, 0),
      settledAmount: partners.reduce((sum, p) => sum + p.settledAmount, 0),
      totalCommission: partners.reduce((sum, p) => sum + p.commissionAmount, 0),
      totalPayout: partners.reduce((sum, p) => sum + p.payoutAmount, 0),
    };

    return {
      partners,
      totals,
      eventCommissionRate: Number(event.commissionRate),
    };
  }

  async updatePartnerCommission(
    eventId: string,
    partnerId: string,
    userId: string,
    commissionRate: number,
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

    eventPartner.commissionRate = commissionRate;
    return this.eventPartnerRepository.save(eventPartner);
  }

  async getEventContractDetail(
    eventId: string,
    contractId: string,
    userId: string,
  ): Promise<Contract> {
    const orgId = await this.getOrgIdForUser(userId);

    // Verify organizer access
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }
    if (event.organizerId !== orgId) {
      throw new ForbiddenException('이벤트에 대한 접근 권한이 없습니다.');
    }

    const contract = await this.contractRepository.findOne({
      where: { id: contractId, eventId },
      relations: [
        'template',
        'template.fields',
        'event',
        'partner',
        'customer',
        'fieldValues',
        'fieldValues.field',
        'signatures',
        'histories',
      ],
    });
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    return contract;
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
