import { IsString, IsOptional, IsInt, Min, IsDateString } from 'class-validator';

export class CreateVisitDto {
  @IsString()
  inviteCode: string;

  @IsDateString()
  visitDate: string;

  @IsInt()
  @Min(1)
  guestCount: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
