import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, AuthProvider, UserStatus } from '../../modules/users/entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const email = 'admin@dealflow.com';
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const passwordHash = await bcrypt.hash('Admin1234!', 10);
    const admin = this.userRepository.create({
      email,
      name: '관리자',
      role: UserRole.ADMIN,
      authProvider: AuthProvider.EMAIL,
      passwordHash,
      status: UserStatus.ACTIVE,
    });
    await this.userRepository.save(admin);
    this.logger.log('Admin account created: admin@dealflow.com');
  }
}
