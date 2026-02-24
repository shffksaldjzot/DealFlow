import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserRole,
  AuthProvider,
  UserStatus,
} from '../users/entities/user.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization, OrgStatus } from '../organizations/entities/organization.entity';
import { Notification, NotificationType, NotificationStatus } from '../notifications/entities/notification.entity';
import {
  EmailLoginDto,
  SignupDto,
  SocialLoginDto,
  TokenResponseDto,
} from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { MailService } from '../../shared/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async socialLogin(dto: SocialLoginDto): Promise<TokenResponseDto> {
    // In production, verify the access token with the OAuth provider
    // For MVP, we'll simulate social login by creating/finding user
    let profile: { id: string; email: string; name: string };

    if (dto.provider === AuthProvider.KAKAO) {
      profile = await this.getKakaoProfile(dto.accessToken);
    } else {
      throw new UnauthorizedException('지원하지 않는 소셜 로그인입니다.');
    }

    let user = await this.usersRepository.findOne({
      where: { authProvider: dto.provider, authProviderId: profile.id },
    });

    if (!user) {
      user = this.usersRepository.create({
        email: profile.email,
        name: profile.name,
        role: dto.role || UserRole.CUSTOMER,
        authProvider: dto.provider,
        authProviderId: profile.id,
        status: UserStatus.ACTIVE,
      });
      user = await this.usersRepository.save(user);
    }

    return this.generateTokens(user);
  }

  async emailLogin(dto: EmailLoginDto): Promise<TokenResponseDto> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    // Block login for organizer/partner if org is not approved
    if (user.role === UserRole.ORGANIZER || user.role === UserRole.PARTNER) {
      const membership = await this.memberRepository.findOne({
        where: { userId: user.id },
      });
      if (!membership) {
        throw new UnauthorizedException(
          '업체 등록이 필요합니다. 회원가입 후 업체 등록을 완료해주세요.',
        );
      }
      const org = await this.orgRepository.findOne({
        where: { id: membership.organizationId },
      });
      if (!org || org.status !== OrgStatus.APPROVED) {
        throw new UnauthorizedException(
          '가입 승인 대기 중입니다. 관리자 승인 후 로그인 가능합니다.',
        );
      }
    }

    return this.generateTokens(user);
  }

  async signup(dto: SignupDto): Promise<TokenResponseDto> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      authProvider: AuthProvider.EMAIL,
      passwordHash,
      status: UserStatus.ACTIVE,
    });
    const saved = await this.usersRepository.save(user);

    return this.generateTokens(saved);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateMe(userId: string, data: { name?: string; phone?: string; address?: string }) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.address !== undefined) user.address = data.address;

    const saved = await this.usersRepository.save(user);
    const { passwordHash, ...result } = saved;
    return result;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user || !user.passwordHash) {
      throw new BadRequestException('비밀번호를 변경할 수 없는 계정입니다.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('새 비밀번호는 8자 이상이어야 합니다.');
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new BadRequestException('비밀번호는 대문자, 소문자, 숫자를 각각 1개 이상 포함해야 합니다.');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('해당 이메일로 가입된 계정을 찾을 수 없습니다.');
    }

    if (!user.phone || user.phone.replace(/[^0-9]/g, '') !== dto.phone.replace(/[^0-9]/g, '')) {
      throw new BadRequestException('이메일과 전화번호가 일치하지 않습니다.');
    }

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Send temporary password via email FIRST (before changing password)
    try {
      await this.mailService.sendMail(
        user.email,
        '[DealFlow] 임시 비밀번호 안내',
        `안녕하세요, ${user.name}님.\n\n임시 비밀번호가 발급되었습니다.\n\n임시 비밀번호: ${temporaryPassword}\n\n로그인 후 반드시 비밀번호를 변경해주세요.\n\n감사합니다.\nDealFlow`,
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
          <h2 style="color:#2563eb">DealFlow</h2>
          <p>안녕하세요, <strong>${user.name}</strong>님.</p>
          <p>임시 비밀번호가 발급되었습니다.</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
            <p style="font-size:12px;color:#64748b;margin:0 0 4px">임시 비밀번호</p>
            <p style="font-size:24px;font-weight:bold;color:#1e293b;margin:0;letter-spacing:2px">${temporaryPassword}</p>
          </div>
          <p style="color:#ef4444;font-size:14px">로그인 후 반드시 비밀번호를 변경해주세요.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
          <p style="font-size:12px;color:#94a3b8">이 메일은 DealFlow에서 자동 발송되었습니다.</p>
        </div>`,
      );
    } catch {
      throw new BadRequestException('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }

    // Email sent successfully — now update password in DB
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ passwordHash })
      .where('id = :id', { id: user.id })
      .execute();

    // Also notify admins (secondary)
    const admins = await this.usersRepository.find({
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });
    for (const admin of admins) {
      const notification = this.notificationRepository.create({
        userId: admin.id,
        type: NotificationType.PUSH,
        title: '비밀번호 자동 초기화',
        content: `${user.name} (${user.email})님의 비밀번호가 자동 초기화되었습니다.`,
        status: NotificationStatus.SENT,
        metadata: {
          type: 'password_reset_request',
          targetUserId: user.id,
          targetUserName: user.name,
          targetUserEmail: user.email,
        },
      });
      await this.notificationRepository.save(notification);
    }

    return { message: '임시 비밀번호가 이메일로 발송되었습니다.' };
  }

  private generateTemporaryPassword(): string {
    const { randomBytes } = require('crypto');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = randomBytes(12);
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(bytes[i] % chars.length);
    }
    return password + '!A1';
  }

  private generateTokens(user: User): TokenResponseDto {
    const payload = { sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }

  private async getKakaoProfile(
    accessToken: string,
  ): Promise<{ id: string; email: string; name: string }> {
    // In production, call Kakao API to verify token
    // For dev/MVP, simulate with token as user identifier
    try {
      const response = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new UnauthorizedException('카카오 인증에 실패했습니다.');
      }
      const data = await response.json();
      return {
        id: String(data.id),
        email: data.kakao_account?.email || `kakao_${data.id}@dealflow.app`,
        name: data.properties?.nickname || '사용자',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('카카오 인증에 실패했습니다. 다시 시도해주세요.');
    }
  }

}
