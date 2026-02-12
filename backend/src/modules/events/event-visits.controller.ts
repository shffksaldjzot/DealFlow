import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventVisitsService } from './event-visits.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateVisitDto } from './dto/create-visit.dto';

@Controller('event-visits')
export class EventVisitsController {
  constructor(private readonly eventVisitsService: EventVisitsService) {}

  @Post()
  @Roles('customer')
  createReservation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVisitDto,
  ) {
    return this.eventVisitsService.createReservation(userId, dto);
  }

  @Get('my')
  @Roles('customer')
  listMyReservations(@CurrentUser('id') userId: string) {
    return this.eventVisitsService.listMyReservations(userId);
  }

  @Post(':id/cancel')
  @Roles('customer')
  cancelReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventVisitsService.cancelReservation(id, userId);
  }
}
