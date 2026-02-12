import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  eventId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  customerName?: string;
}
