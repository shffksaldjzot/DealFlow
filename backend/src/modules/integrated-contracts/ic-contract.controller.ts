import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IcContractService } from './ic-contract.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateIcContractDto } from './dto/create-ic-contract.dto';

@Controller('ic')
export class IcContractController {
  constructor(private readonly icContractService: IcContractService) {}

  // --- 고객 계약 플로우 ---

  @Public()
  @Get('contract-flow/:eventId')
  getContractFlow(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.icContractService.getContractFlow(eventId);
  }

  @Public()
  @Get('contract-flow/:eventId/type/:typeId')
  getContractFlowByType(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('typeId', ParseUUIDPipe) typeId: string,
  ) {
    return this.icContractService.getContractFlowByType(eventId, typeId);
  }

  @Public()
  @Get('contract-flow-by-code/:inviteCode')
  getContractFlowByInviteCode(@Param('inviteCode') inviteCode: string) {
    return this.icContractService.getContractFlowByInviteCode(inviteCode);
  }

  @Public()
  @Get('contract-flow-by-code/:inviteCode/type/:typeId')
  getContractFlowByCodeAndType(
    @Param('inviteCode') inviteCode: string,
    @Param('typeId', ParseUUIDPipe) typeId: string,
  ) {
    return this.icContractService.getContractFlowByInviteCodeAndType(inviteCode, typeId);
  }

  @Post('contracts')
  @Roles('customer')
  createContract(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIcContractDto,
  ) {
    return this.icContractService.createContract(userId, dto);
  }

  @Get('contracts/my')
  @Roles('customer')
  findMyContracts(@CurrentUser('id') userId: string) {
    return this.icContractService.findMyContracts(userId);
  }

  @Public()
  @Get('contracts/short/:shortCode')
  findByShortCode(@Param('shortCode') shortCode: string) {
    return this.icContractService.findByShortCode(shortCode);
  }

  @Get('contracts/event/:eventId')
  @Roles('organizer', 'admin')
  findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.icContractService.findByEventId(eventId);
  }

  @Get('contracts/partner/my')
  @Roles('partner')
  findPartnerContracts(@CurrentUser('id') userId: string) {
    return this.icContractService.findPartnerContracts(userId);
  }

  @Get('contracts/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.icContractService.findOneById(id);
  }
}
