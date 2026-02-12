import { IsString, Length } from 'class-validator';

export class JoinEventDto {
  @IsString()
  @Length(1, 20)
  inviteCode: string;
}
