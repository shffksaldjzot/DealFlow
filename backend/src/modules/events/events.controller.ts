import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles('organizer')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(userId, dto);
  }

  @Get()
  listMyEvents(@CurrentUser('id') userId: string) {
    return this.eventsService.listMyEvents(userId);
  }

  @Public()
  @Get('public/:inviteCode')
  getPublicEventInfo(@Param('inviteCode') inviteCode: string) {
    return this.eventsService.getPublicEventInfo(inviteCode);
  }

  @Get(':id')
  getEventDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.getEventDetail(id, userId);
  }

  @Patch(':id')
  @Roles('organizer')
  updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(id, userId, dto);
  }

  @Patch(':id/status')
  @Roles('organizer')
  updateEventStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEventStatusDto,
  ) {
    return this.eventsService.updateEventStatus(id, userId, dto);
  }

  @Get(':id/partners')
  @Roles('organizer')
  listPartners(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.listPartners(id, userId);
  }

  @Patch(':id/partners/:partnerId')
  @Roles('organizer')
  updatePartnerStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('partnerId', ParseUUIDPipe) partnerId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePartnerStatusDto,
  ) {
    return this.eventsService.updatePartnerStatus(id, partnerId, userId, dto);
  }

  @Get(':id/contracts')
  getContractsSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.getContractsSummary(id, userId);
  }
}
