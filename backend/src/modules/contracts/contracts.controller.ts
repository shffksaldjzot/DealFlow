import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateContractDto } from './dto/create-contract.dto';
import { CancelContractDto } from './dto/cancel-contract.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SaveFieldsDto } from './dto/save-fields.dto';

@Controller('contracts')
@Roles('partner')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  createContract(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.createContract(userId, dto);
  }

  @Get()
  listContracts(
    @CurrentUser('id') userId: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.contractsService.listContracts(userId, eventId);
  }

  @Get(':id')
  getContractDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.getContractDetail(id, userId);
  }

  @Post(':id/cancel')
  cancelContract(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CancelContractDto,
  ) {
    return this.contractsService.cancelContract(id, userId, dto);
  }

  @Get(':id/qr')
  getQrInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.getQrInfo(id, userId);
  }
}
