import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentStageDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  ratio: number;
}

export class CreateIcConfigDto {
  @IsUUID()
  eventId: string;

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
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
