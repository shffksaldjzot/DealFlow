import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { AuthProvider, UserRole } from '../../users/entities/user.entity';

export class SocialLoginDto {
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class EmailLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
    createdAt?: Date;
  };
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  newPassword: string;
}
