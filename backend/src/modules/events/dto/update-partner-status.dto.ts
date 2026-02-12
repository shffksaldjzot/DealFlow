import { IsEnum, IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { EventPartnerStatus } from '../entities/event-partner.entity';

export class UpdatePartnerStatusDto {
  @IsEnum(EventPartnerStatus)
  status: EventPartnerStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}
