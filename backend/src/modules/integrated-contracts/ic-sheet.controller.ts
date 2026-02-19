import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IcSheetService } from './ic-sheet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateIcSheetDto } from './dto/create-ic-sheet.dto';
import { UpdateIcSheetDto } from './dto/update-ic-sheet.dto';
import { SaveSheetColumnsDto } from './dto/save-sheet-columns.dto';
import { SaveSheetRowsDto } from './dto/save-sheet-rows.dto';

@Controller('ic/sheets')
@Roles('partner')
export class IcSheetController {
  constructor(private readonly icSheetService: IcSheetService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIcSheetDto,
  ) {
    return this.icSheetService.create(userId, dto);
  }

  @Get('my')
  findMySheets(
    @CurrentUser('id') userId: string,
    @Query('configId', ParseUUIDPipe) configId: string,
  ) {
    return this.icSheetService.findMySheets(userId, configId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.icSheetService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateIcSheetDto,
  ) {
    return this.icSheetService.update(id, userId, dto);
  }

  @Put(':id/columns')
  saveColumns(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveSheetColumnsDto,
  ) {
    return this.icSheetService.saveColumns(id, userId, dto);
  }

  @Put(':id/rows')
  saveRows(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveSheetRowsDto,
  ) {
    return this.icSheetService.saveRows(id, userId, dto);
  }

  @Post(':id/rows')
  addRow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { optionName: string; popupContent?: string; sortOrder?: number; prices?: Record<string, number> },
  ) {
    return this.icSheetService.addRow(id, userId, body);
  }

  @Patch(':id/rows/:rowId')
  updateRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('rowId', ParseUUIDPipe) rowId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { optionName?: string; popupContent?: string; sortOrder?: number; prices?: Record<string, number> },
  ) {
    return this.icSheetService.updateRow(id, rowId, userId, body);
  }

  @Delete(':id/rows/:rowId')
  deleteRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('rowId', ParseUUIDPipe) rowId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.icSheetService.deleteRow(id, rowId, userId);
  }
}
