import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  eventId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;
}
