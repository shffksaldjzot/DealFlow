import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Event } from '../events/entities/event.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { ContractFieldValue } from '../contracts/entities/contract-field-value.entity';
import { ContractSignature } from '../contracts/entities/contract-signature.entity';
import { ContractHistory } from '../contracts/entities/contract-history.entity';
import { ActivityLog } from './entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      OrganizationMember,
      Event,
      Contract,
      ContractFieldValue,
      ContractSignature,
      ContractHistory,
      ActivityLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
