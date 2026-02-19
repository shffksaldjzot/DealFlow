import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IcConfigService } from './ic-config.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateIcConfigDto } from './dto/create-ic-config.dto';
import { UpdateIcConfigDto } from './dto/update-ic-config.dto';
import { CreateApartmentTypeDto } from './dto/create-apartment-type.dto';

@Controller('ic/configs')
export class IcConfigController {
  constructor(private readonly icConfigService: IcConfigService) {}

  @Post()
  @Roles('organizer')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIcConfigDto,
  ) {
    return this.icConfigService.create(userId, dto);
  }

  @Get('event/:eventId')
  findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.icConfigService.findByEventId(eventId);
  }

  @Patch(':id')
  @Roles('organizer')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateIcConfigDto,
  ) {
    return this.icConfigService.update(id, userId, dto);
  }

  @Post(':id/apartment-types')
  @Roles('organizer')
  addApartmentType(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApartmentTypeDto,
  ) {
    return this.icConfigService.addApartmentType(id, userId, dto);
  }

  @Patch(':id/apartment-types/:tid')
  @Roles('organizer')
  updateApartmentType(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tid', ParseUUIDPipe) tid: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApartmentTypeDto,
  ) {
    return this.icConfigService.updateApartmentType(id, tid, userId, dto);
  }

  @Delete(':id/apartment-types/:tid')
  @Roles('organizer')
  deleteApartmentType(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tid', ParseUUIDPipe) tid: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.icConfigService.deleteApartmentType(id, tid, userId);
  }
}
