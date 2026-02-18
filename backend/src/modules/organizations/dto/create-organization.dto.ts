import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  Length,
  IsEmail,
} from 'class-validator';
import { OrgType } from '../entities/organization.entity';

export class CreateOrganizationDto {
  @IsEnum(OrgType)
  type: OrgType;

  @IsString()
  @Length(1, 200)
  name: string;

  @IsString()
  @Length(1, 20)
  businessNumber: string;

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

  @IsOptional()
  @IsString()
  items?: string;
}
