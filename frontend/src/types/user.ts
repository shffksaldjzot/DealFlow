export type UserRole = 'customer' | 'organizer' | 'partner' | 'admin';
export type AuthProvider = 'kakao' | 'naver' | 'google' | 'apple' | 'email';
export type UserStatus = 'active' | 'suspended' | 'withdrawn';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  authProvider: AuthProvider;
  status: UserStatus;
  profileImage?: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}
