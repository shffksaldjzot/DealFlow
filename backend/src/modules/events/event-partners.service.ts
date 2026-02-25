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
    items?: string,
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
      // Allow re-request for cancelled or rejected partnerships
      if (
        existing.status === EventPartnerStatus.CANCELLED ||
        existing.status === EventPartnerStatus.REJECTED
      ) {
        existing.status = EventPartnerStatus.PENDING;
        existing.cancelledAt = null;
        existing.cancelledBy = null;
        existing.cancelReason = null;
        if (items) existing.items = items;
        const saved = await this.eventPartnerRepository.save(existing);

        const partnerOrg = await this.orgRepository.findOne({ where: { id: orgId } });
        const partnerName = partnerOrg?.name || '협력업체';

        try {
          const organizerOwner = await this.memberRepository.findOne({
            where: { organizationId: event.organizerId, role: MemberRole.OWNER },
          });
          if (organizerOwner) {
            await this.notificationsService.createNotification({
              userId: organizerOwner.userId,
              type: 'partner_joined',
              title: `[${event.name}] 협력업체 재참가 요청`,
              message: `"${partnerName}"이(가) 행사 "${event.name}"에 재참가를 요청했습니다.`,
              relatedId: event.id,
              relatedType: 'event',
            });
          }
        } catch {}

        await this.activityLogService.log(
          'partner_rejoin_request',
          `"${partnerName}"이(가) 행사 "${event.name}" 재참가 신청`,
          userId,
          'event_partner',
          saved.id,
        );

        return this.eventPartnerRepository.findOne({
          where: { id: saved.id },
          relations: ['event', 'event.organizer', 'partner'],
        });
      }
      throw new ConflictException('이미 참가한 이벤트입니다.');
    }

    // Use provided items, or fall back to org default items
    let partnerItems = items || null;
    if (!partnerItems) {
      const org = await this.orgRepository.findOne({ where: { id: orgId } });
      if (org?.items) {
        partnerItems = org.items;
      }
    }

    const eventPartner = this.eventPartnerRepository.create({
      eventId: event.id,
      partnerId: orgId,
      status: EventPartnerStatus.PENDING,
      items: partnerItems,
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
        const itemsInfo = partnerItems ? ` (품목: ${partnerItems})` : '';
        await this.notificationsService.createNotification({
          userId: organizerOwner.userId,
          type: 'partner_joined',
          title: `[${event.name}] 새로운 협력업체 참가 요청`,
          message: `"${partnerName}"이(가) 행사 "${event.name}"에 참가를 요청했습니다.${itemsInfo} 협력업체 관리에서 승인 또는 거절해주세요.`,
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

  async withdrawParticipation(userId: string, eventId: string): Promise<{ message: string }> {
    const orgId = await this.getOrgIdForUser(userId);

    const eventPartner = await this.eventPartnerRepository.findOne({
      where: { eventId, partnerId: orgId },
      relations: ['event', 'partner'],
    });
    if (!eventPartner) {
      throw new NotFoundException('참가 정보를 찾을 수 없습니다.');
    }

    // Only pending or cancelled can be deleted
    if (eventPartner.status === EventPartnerStatus.APPROVED) {
      throw new ForbiddenException(
        '승인된 참가는 삭제할 수 없습니다. 먼저 참가 취소를 진행해주세요.',
      );
    }

    const partnerName = eventPartner.partner?.name || '협력업체';
    const eventName = eventPartner.event?.name || '행사';

    await this.eventPartnerRepository.remove(eventPartner);

    await this.activityLogService.log(
      'partner_withdraw',
      `"${partnerName}"이(가) 행사 "${eventName}" 참가 신청 철회`,
      userId,
      'event_partner',
      eventId,
    );

    return { message: '참가 신청이 철회되었습니다.' };
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
