import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractStatus } from './entities/contract.entity';
import { ContractHistory } from './entities/contract-history.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('customer/contracts')
@Roles('customer')
export class CustomerContractsController {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ContractHistory)
    private readonly historyRepository: Repository<ContractHistory>,
  ) {}

  @Get()
  async listMyContracts(@CurrentUser('id') userId: string) {
    return this.contractRepository.find({
      where: { customerId: userId },
      relations: ['event', 'partner'],
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':id')
  async getContractDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const contract = await this.contractRepository.findOne({
      where: { id, customerId: userId },
      relations: [
        'template',
        'template.fields',
        'event',
        'partner',
        'fieldValues',
        'fieldValues.field',
        'signatures',
      ],
    });
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }
    return contract;
  }

  @Post(':id/cancel')
  async cancelContract(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    const contract = await this.contractRepository.findOne({
      where: { id, customerId: userId },
    });
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    if (
      contract.status === ContractStatus.SIGNED ||
      contract.status === ContractStatus.COMPLETED ||
      contract.status === ContractStatus.CANCELLED
    ) {
      throw new BadRequestException(
        '서명 완료, 완료 또는 이미 취소된 계약은 취소할 수 없습니다.',
      );
    }

    const fromStatus = contract.status;
    contract.status = ContractStatus.CANCELLED;
    contract.cancelledBy = userId;
    contract.cancelReason = body.reason || '고객 요청에 의한 취소';
    contract.cancelledAt = new Date();

    const saved = await this.contractRepository.save(contract);

    await this.historyRepository.save(
      this.historyRepository.create({
        contractId: id,
        fromStatus,
        toStatus: ContractStatus.CANCELLED,
        changedBy: userId,
        reason: body.reason || '고객 요청에 의한 취소',
      }),
    );

    return saved;
  }
}
