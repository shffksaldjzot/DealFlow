import { IsUUID, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
