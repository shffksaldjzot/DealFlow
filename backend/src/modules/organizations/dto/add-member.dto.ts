import { IsEmail, IsOptional, IsEnum } from 'class-validator';
import { MemberRole } from '../entities/organization-member.entity';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}
