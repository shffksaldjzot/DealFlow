import { IsString, IsUUID, IsOptional, IsInt, Length, Min } from 'class-validator';

export class CreateTemplateDto {
  @IsUUID()
  eventId: string;

  @IsString()
  @Length(1, 300)
  name: string;

  @IsUUID()
  fileId: string;

  @IsString()
  @Length(1, 10)
  fileType: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageCount?: number;
}
