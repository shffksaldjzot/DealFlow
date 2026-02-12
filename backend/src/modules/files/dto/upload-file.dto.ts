import { IsOptional, IsString, Length } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  purpose?: string;
}
