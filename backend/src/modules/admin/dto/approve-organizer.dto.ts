import { IsOptional, IsString, IsEmail, IsEnum, IsIn, MinLength } from 'class-validator';

export class RejectOrganizerDto {
  @IsString()
  reason: string;
}

export class ChangeUserStatusDto {
  @IsIn(['pending', 'active', 'suspended', 'withdrawn'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['customer', 'organizer', 'partner', 'admin'])
  role?: string;

  @IsOptional()
  @IsIn(['pending', 'active', 'suspended', 'withdrawn'])
  status?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsIn(['customer', 'organizer', 'partner', 'admin'])
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class AdminUpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['draft', 'active', 'closed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AdminUpdateContractStatusDto {
  @IsIn(['pending', 'in_progress', 'signed', 'completed', 'cancelled'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}

export class AdminUpdateIcContractStatusDto {
  @IsString()
  @IsIn(['draft', 'signed', 'completed', 'cancelled'])
  status: string;
}
