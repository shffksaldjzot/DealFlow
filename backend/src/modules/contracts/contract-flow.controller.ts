import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ContractFlowService } from './contract-flow.service';
import { Public } from '../../common/decorators/public.decorator';
import { FillContractDto } from './dto/fill-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

@Controller('contract-flow')
@Public()
export class ContractFlowController {
  constructor(private readonly contractFlowService: ContractFlowService) {}

  @Get(':qrCode')
  getContractByQr(@Param('qrCode') qrCode: string) {
    return this.contractFlowService.getContractByQr(qrCode);
  }

  @Post(':qrCode/start')
  startFilling(
    @Param('qrCode') qrCode: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || null;
    return this.contractFlowService.startFilling(qrCode, userId);
  }

  @Post(':qrCode/fill')
  fillFields(
    @Param('qrCode') qrCode: string,
    @Body() dto: FillContractDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || null;
    return this.contractFlowService.fillFields(qrCode, dto, userId);
  }

  @Post(':qrCode/sign')
  submitSignature(
    @Param('qrCode') qrCode: string,
    @Body() dto: SignContractDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || null;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.contractFlowService.submitSignature(
      qrCode,
      dto,
      userId,
      ipAddress,
      userAgent,
    );
  }
}
