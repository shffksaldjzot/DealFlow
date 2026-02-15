import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventPartnersController } from './event-partners.controller';
import { EventPartnersService } from './event-partners.service';
import { EventVisitsController } from './event-visits.controller';
import { EventVisitsService } from './event-visits.service';
import { Event } from './entities/event.entity';
import { EventPartner } from './entities/event-partner.entity';
import { EventVisit } from './entities/event-visit.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventPartner,
      EventVisit,
      Contract,
      OrganizationMember,
      Organization,
    ]),
    NotificationsModule,
  ],
  controllers: [EventsController, EventPartnersController, EventVisitsController],
  providers: [EventsService, EventPartnersService, EventVisitsService],
  exports: [EventsService, EventPartnersService, EventVisitsService],
})
export class EventsModule {}
