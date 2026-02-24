import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStageDto } from './create-ic-config.dto';
import { IcConfigStatus } from '../entities/ic-config.entity';

export class UpdateIcConfigDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentStageDto)
  paymentStages?: PaymentStageDto[];

  @IsOptional()
  @IsString()
  legalTerms?: string;

  @IsOptional()
  @IsString()
  specialNotes?: string;

  @IsOptional()
  @IsEnum(IcConfigStatus)
  status?: IcConfigStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
