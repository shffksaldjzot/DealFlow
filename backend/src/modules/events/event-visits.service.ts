import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventVisit } from './entities/event-visit.entity';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class EventVisitsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventVisit)
    private readonly visitRepository: Repository<EventVisit>,
  ) {}

  async createReservation(
    userId: string,
    dto: CreateVisitDto,
  ): Promise<EventVisit> {
    const event = await this.eventRepository.findOne({
      where: { inviteCode: dto.inviteCode },
    });
    if (!event) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }

    if (event.status !== 'active') {
      throw new BadRequestException('현재 접수 중인 행사가 아닙니다.');
    }

    const visit = this.visitRepository.create({
      eventId: event.id,
      customerId: userId,
      visitDate: dto.visitDate,
      guestCount: dto.guestCount,
      memo: dto.memo || null,
      status: 'reserved',
    });

    const saved = await this.visitRepository.save(visit);
    return this.visitRepository.findOne({
      where: { id: saved.id },
      relations: ['event'],
    });
  }

  async listMyReservations(userId: string): Promise<EventVisit[]> {
    return this.visitRepository.find({
      where: { customerId: userId },
      relations: ['event'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelReservation(
    visitId: string,
    userId: string,
  ): Promise<EventVisit> {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId, customerId: userId },
    });
    if (!visit) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    if (visit.status !== 'reserved') {
      throw new BadRequestException('취소할 수 없는 상태입니다.');
    }

    visit.status = 'cancelled';
    return this.visitRepository.save(visit);
  }
}
