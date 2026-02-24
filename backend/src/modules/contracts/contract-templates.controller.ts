import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SaveFieldsDto } from './dto/save-fields.dto';

@Controller('contract-templates')
@Roles('partner')
export class ContractTemplatesController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  createTemplate(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.contractsService.createTemplate(userId, dto);
  }

  @Get()
  listTemplates(
    @CurrentUser('id') userId: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.contractsService.listTemplates(userId, eventId);
  }

  @Get(':id')
  getTemplateDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.getTemplateDetail(id, userId);
  }

  @Post(':id/fields')
  saveFields(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveFieldsDto,
  ) {
    return this.contractsService.saveFields(id, userId, dto);
  }

  @Delete(':id')
  deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.deleteTemplate(id, userId);
  }

  @Get(':id/fields')
  getFields(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.getFields(id, userId);
  }
}
