import { IsOptional, IsString } from 'class-validator';

export class RejectOrganizerDto {
  @IsString()
  reason: string;
}

export class ChangeUserStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
