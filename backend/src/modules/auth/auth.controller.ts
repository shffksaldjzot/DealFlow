import { Controller, Post, Get, Patch, Body } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SocialLoginDto,
  EmailLoginDto,
  SignupDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ short: { ttl: 1000, limit: 3 }, medium: { ttl: 60000, limit: 15 } })
  @Post('login/social')
  socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto);
  }

  @Public()
  @Throttle({ short: { ttl: 1000, limit: 3 }, medium: { ttl: 60000, limit: 15 } })
  @Post('login/email')
  emailLogin(@Body() dto: EmailLoginDto) {
    return this.authService.emailLogin(dto);
  }

  @Public()
  @Throttle({ short: { ttl: 1000, limit: 3 }, medium: { ttl: 60000, limit: 10 } })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Throttle({ short: { ttl: 1000, limit: 1 }, medium: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('refresh')
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; phone?: string; address?: string },
  ) {
    return this.authService.updateMe(userId, body);
  }

  @Patch('password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

}
