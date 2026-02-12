import { IsString, Length } from 'class-validator';

export class UpdateFcmTokenDto {
  @IsString()
  @Length(1, 500)
  fcmToken: string;
}
