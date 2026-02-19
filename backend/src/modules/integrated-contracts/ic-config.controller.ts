import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IcConfigService } from './ic-config.service';
import { IcSheetService } from './ic-sheet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateIcConfigDto } from './dto/create-ic-config.dto';
import { UpdateIcConfigDto } from './dto/update-ic-config.dto';
import { CreateApartmentTypeDto } from './dto/create-apartment-type.dto';
import { SaveSheetColumnsDto } from './dto/save-sheet-columns.dto';
import { SaveSheetRowsDto } from './dto/save-sheet-rows.dto';
import { UpdateIcSheetDto } from './dto/update-ic-sheet.dto';

@Controller('ic/configs')
export class IcConfigController {
  constructor(
    private readonly icConfigService: IcConfigService,
    private readonly icSheetService: IcSheetService,
  ) {}

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

  // === Organizer sheet management ===

  @Get(':id/sheets')
  @Roles('organizer')
  findSheets(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.icSheetService.findSheetsByConfigAsOrganizer(id, userId);
  }

  @Put(':id/sheets/:sheetId/columns')
  @Roles('organizer')
  saveSheetColumns(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('sheetId', ParseUUIDPipe) sheetId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveSheetColumnsDto,
  ) {
    return this.icSheetService.saveColumnsAsOrganizer(sheetId, userId, dto);
  }

  @Put(':id/sheets/:sheetId/rows')
  @Roles('organizer')
  saveSheetRows(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('sheetId', ParseUUIDPipe) sheetId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveSheetRowsDto,
  ) {
    return this.icSheetService.saveRowsAsOrganizer(sheetId, userId, dto);
  }

  @Patch(':id/sheets/:sheetId')
  @Roles('organizer')
  updateSheet(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('sheetId', ParseUUIDPipe) sheetId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateIcSheetDto,
  ) {
    return this.icSheetService.updateSheetAsOrganizer(sheetId, userId, dto);
  }
}
