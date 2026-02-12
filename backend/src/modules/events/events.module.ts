import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventPartnersController } from './event-partners.controller';
import { EventPartnersService } from './event-partners.service';
import { Event } from './entities/event.entity';
import { EventPartner } from './entities/event-partner.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventPartner,
      Contract,
      OrganizationMember,
    ]),
    NotificationsModule,
  ],
  controllers: [EventsController, EventPartnersController],
  providers: [EventsService, EventPartnersService],
  exports: [EventsService, EventPartnersService],
})
export class EventsModule {}
