import { IsEmail, IsString, IsOptional, IsEnum, MinLength, Matches } from 'class-validator';
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
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/, {
    message: '비밀번호는 대문자, 소문자, 숫자를 각각 1개 이상 포함해야 합니다.',
  })
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
