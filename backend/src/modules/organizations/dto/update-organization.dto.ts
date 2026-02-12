import { IsString, IsOptional, IsUUID, Length, IsEmail } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  businessNumber?: string;

  @IsOptional()
  @IsUUID()
  businessLicenseFileId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  representativeName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
