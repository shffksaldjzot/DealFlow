import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsController } from './contracts.controller';
import { ContractTemplatesController } from './contract-templates.controller';
import { ContractFlowController } from './contract-flow.controller';
import { CustomerContractsController } from './customer-contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractFlowService } from './contract-flow.service';
import { Contract } from './entities/contract.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractField } from './entities/contract-field.entity';
import { ContractFieldValue } from './entities/contract-field-value.entity';
import { ContractSignature } from './entities/contract-signature.entity';
import { ContractHistory } from './entities/contract-history.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { EventPartner } from '../events/entities/event-partner.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      ContractTemplate,
      ContractField,
      ContractFieldValue,
      ContractSignature,
      ContractHistory,
      OrganizationMember,
      EventPartner,
    ]),
    NotificationsModule,
    FilesModule,
  ],
  controllers: [
    ContractsController,
    ContractTemplatesController,
    ContractFlowController,
    CustomerContractsController,
  ],
  providers: [ContractsService, ContractFlowService],
  exports: [ContractsService, ContractFlowService],
})
export class ContractsModule {}
