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
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventPartnersService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventPartner)
    private readonly eventPartnerRepository: Repository<EventPartner>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    private readonly notificationsService: NotificationsService,
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

  async joinByInviteCode(
    userId: string,
    inviteCode: string,
  ): Promise<EventPartner> {
    const orgId = await this.getOrgIdForUser(userId);

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
          message: `행사 "${event.name}"에 새로운 파트너가 참여를 요청했습니다.`,
          relatedId: event.id,
          relatedType: 'event',
        });
      }
    } catch {
      // Do not fail the join flow if notification fails
    }

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
      relations: ['event'],
    });
    if (!eventPartner) {
      throw new NotFoundException('참가 정보를 찾을 수 없습니다.');
    }

    if (eventPartner.status !== EventPartnerStatus.APPROVED) {
      throw new ForbiddenException('승인된 상태에서만 참가 취소가 가능합니다.');
    }

    eventPartner.status = EventPartnerStatus.CANCELLED;
    eventPartner.cancelledAt = new Date();
    eventPartner.cancelledBy = userId;
    eventPartner.cancelReason = reason || null;

    return this.eventPartnerRepository.save(eventPartner);
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
