import { IsString, IsOptional, Length } from 'class-validator';

export class JoinEventDto {
  @IsString()
  @Length(1, 20)
  inviteCode: string;

  @IsOptional()
  @IsString()
  items?: string;
}
