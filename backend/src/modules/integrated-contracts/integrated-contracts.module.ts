import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IcConfig } from './entities/ic-config.entity';
import { IcApartmentType } from './entities/ic-apartment-type.entity';
import { IcPartnerSheet } from './entities/ic-partner-sheet.entity';
import { IcSheetColumn } from './entities/ic-sheet-column.entity';
import { IcSheetRow } from './entities/ic-sheet-row.entity';
import { IcContract } from './entities/ic-contract.entity';
import { Event } from '../events/entities/event.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { IcConfigController } from './ic-config.controller';
import { IcSheetController } from './ic-sheet.controller';
import { IcContractController } from './ic-contract.controller';
import { IcConfigService } from './ic-config.service';
import { IcSheetService } from './ic-sheet.service';
import { IcContractService } from './ic-contract.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IcConfig,
      IcApartmentType,
      IcPartnerSheet,
      IcSheetColumn,
      IcSheetRow,
      IcContract,
      Event,
      OrganizationMember,
      Organization,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [IcConfigController, IcSheetController, IcContractController],
  providers: [IcConfigService, IcSheetService, IcContractService],
  exports: [IcConfigService, IcSheetService, IcContractService],
})
export class IntegratedContractsModule {}
