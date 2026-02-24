import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { EventPartnersService } from './event-partners.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JoinEventDto } from './dto/join-event.dto';

@Controller('event-partners')
export class EventPartnersController {
  constructor(
    private readonly eventPartnersService: EventPartnersService,
  ) {}

  @Post('join')
  @Roles('partner')
  joinEvent(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinEventDto,
  ) {
    return this.eventPartnersService.joinByInviteCode(userId, dto.inviteCode, dto.items);
  }

  @Get('my-events')
  @Roles('partner')
  listMyParticipatedEvents(@CurrentUser('id') userId: string) {
    return this.eventPartnersService.listMyParticipatedEvents(userId);
  }

  @Post(':eventId/cancel')
  @Roles('partner')
  cancelParticipation(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.eventPartnersService.cancelParticipation(userId, eventId, body.reason);
  }

  @Delete(':eventId')
  @Roles('partner')
  withdrawParticipation(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventPartnersService.withdrawParticipation(userId, eventId);
  }
}
