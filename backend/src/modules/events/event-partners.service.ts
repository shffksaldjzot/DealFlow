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
import { OrganizationMember } from '../organizations/entities/organization-member.entity';

@Injectable()
export class EventPartnersService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventPartner)
    private readonly eventPartnerRepository: Repository<EventPartner>,
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
    return this.eventPartnerRepository.findOne({
      where: { id: saved.id },
      relations: ['event', 'event.organizer', 'partner'],
    });
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
