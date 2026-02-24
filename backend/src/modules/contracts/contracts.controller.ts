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
import { CreateContractDto } from './dto/create-contract.dto';
import { CancelContractDto } from './dto/cancel-contract.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SaveFieldsDto } from './dto/save-fields.dto';
import { FillContractDto } from './dto/fill-contract.dto';

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

  @Post(':id/prefill')
  prefillContract(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: FillContractDto,
  ) {
    return this.contractsService.prefillContract(id, userId, dto);
  }

  @Delete(':id')
  deleteContract(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.deleteContract(id, userId);
  }

  @Get(':id/qr')
  getQrInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.getQrInfo(id, userId);
  }
}
