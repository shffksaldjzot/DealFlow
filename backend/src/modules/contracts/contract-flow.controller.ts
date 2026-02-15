import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ContractFlowService } from './contract-flow.service';
import { FilesService } from '../files/files.service';
import { Public } from '../../common/decorators/public.decorator';
import { FillContractDto } from './dto/fill-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

@Controller('contract-flow')
@Public()
export class ContractFlowController {
  constructor(
    private readonly contractFlowService: ContractFlowService,
    private readonly filesService: FilesService,
  ) {}

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

  @Get(':qrCode/template-file')
  async getTemplateFile(
    @Param('qrCode') qrCode: string,
    @Res() res: Response,
  ) {
    const contract = await this.contractFlowService.getContractByQr(qrCode);
    if (!contract.template?.fileId) {
      res.status(404).json({ message: '템플릿 파일이 없습니다.' });
      return;
    }
    const { buffer, file } = await this.filesService.getFileBuffer(contract.template.fileId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(buffer);
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
