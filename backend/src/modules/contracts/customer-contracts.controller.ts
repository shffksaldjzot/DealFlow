import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('customer/contracts')
@Roles('customer')
export class CustomerContractsController {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
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
}
