import { Controller, Get, Post, Body } from '@nestjs/common';
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
    return this.eventPartnersService.joinByInviteCode(userId, dto.inviteCode);
  }

  @Get('my-events')
  @Roles('partner')
  listMyParticipatedEvents(@CurrentUser('id') userId: string) {
    return this.eventPartnersService.listMyParticipatedEvents(userId);
  }
}
