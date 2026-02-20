import { IsOptional, IsString, IsEmail, IsEnum, IsIn, MinLength } from 'class-validator';

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

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
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

  @IsString()
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
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AdminUpdateContractStatusDto {
  @IsString()
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
