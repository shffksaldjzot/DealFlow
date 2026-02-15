import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import {
  EventPartner,
  EventPartnerStatus,
} from './entities/event-partner.entity';
import { OrganizationMember, MemberRole } from '../organizations/entities/organization-member.entity';
import { Organization, OrgStatus } from '../organizations/entities/organization.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';

@Injectable()
export class EventPartnersService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventPartner)
    private readonly eventPartnerRepository: Repository<EventPartner>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    private readonly notificationsService: NotificationsService,
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

  async joinByInviteCode(
    userId: string,
    inviteCode: string,
  ): Promise<EventPartner> {
    const orgId = await this.getOrgIdForUser(userId, true);

    const event = await this.eventRepository.findOne({
      where: { inviteCode },
    });
    if (!event) {
      throw new NotFoundException('유효하지 않은 초대 코드입니다.');
    }

    if (event.organizerId === orgId) {
      throw new ForbiddenException(
        '자신이 주최한 이벤트에는 파트너로 참가할 수 없습니다.',
      );
    }

    // Check if already joined
    const existing = await this.eventPartnerRepository.findOne({
      where: { eventId: event.id, partnerId: orgId },
    });
    if (existing) {
      throw new ConflictException('이미 참가한 이벤트입니다.');
    }

    const eventPartner = this.eventPartnerRepository.create({
      eventId: event.id,
      partnerId: orgId,
      status: EventPartnerStatus.PENDING,
    });

    const saved = await this.eventPartnerRepository.save(eventPartner);

    // Get partner org name for logging
    const partnerOrg = await this.orgRepository.findOne({ where: { id: orgId } });
    const partnerName = partnerOrg?.name || '협력업체';

    // Notify the event organizer's org owner
    try {
      const organizerOwner = await this.memberRepository.findOne({
        where: { organizationId: event.organizerId, role: MemberRole.OWNER },
      });
      if (organizerOwner) {
        await this.notificationsService.createNotification({
          userId: organizerOwner.userId,
          type: 'partner_joined',
          title: '새로운 파트너가 행사 참여를 요청했습니다',
          message: `행사 "${event.name}"에 "${partnerName}"이(가) 참여를 요청했습니다.`,
          relatedId: event.id,
          relatedType: 'event',
        });
      }
    } catch {
      // Do not fail the join flow if notification fails
    }

    await this.activityLogService.log(
      'partner_join_request',
      `"${partnerName}"이(가) 행사 "${event.name}" 참가 신청`,
      userId,
      'event_partner',
      saved.id,
    );

    return this.eventPartnerRepository.findOne({
      where: { id: saved.id },
      relations: ['event', 'event.organizer', 'partner'],
    });
  }

  async cancelParticipation(
    userId: string,
    eventId: string,
    reason?: string,
  ): Promise<EventPartner> {
    const orgId = await this.getOrgIdForUser(userId);

    const eventPartner = await this.eventPartnerRepository.findOne({
      where: { eventId, partnerId: orgId },
      relations: ['event', 'partner'],
    });
    if (!eventPartner) {
      throw new NotFoundException('참가 정보를 찾을 수 없습니다.');
    }

    if (eventPartner.status !== EventPartnerStatus.APPROVED) {
      throw new ForbiddenException('승인된 상태에서만 참가 취소가 가능합니다.');
    }

    const partnerName = eventPartner.partner?.name || '협력업체';

    eventPartner.status = EventPartnerStatus.CANCELLED;
    eventPartner.cancelledAt = new Date();
    eventPartner.cancelledBy = userId;
    eventPartner.cancelReason = reason || null;

    const saved = await this.eventPartnerRepository.save(eventPartner);

    await this.activityLogService.log(
      'partner_cancel_participation',
      `"${partnerName}"이(가) 행사 "${eventPartner.event?.name}" 참가 취소${reason ? `: ${reason}` : ''}`,
      userId,
      'event_partner',
      eventPartner.id,
    );

    return saved;
  }

  async listMyParticipatedEvents(userId: string): Promise<EventPartner[]> {
    const orgId = await this.getOrgIdForUser(userId);

    return this.eventPartnerRepository.find({
      where: { partnerId: orgId },
      relations: ['event', 'event.organizer'],
      order: { createdAt: 'DESC' },
    });
  }
}
