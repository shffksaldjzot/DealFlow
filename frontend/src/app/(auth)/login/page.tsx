'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { UserRole } from '@/types/user';

const roles: { value: UserRole; label: string }[] = [
  { value: 'customer', label: '고객' },
  { value: 'organizer', label: '주관사' },
  { value: 'partner', label: '협력업체' },
  { value: 'admin', label: '관리자' },
];

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [step, setStep] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const roleHome: Record<string, string> = {
    customer: '/customer',
    organizer: '/organizer',
    partner: '/partner',
    admin: '/admin',
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      const { user } = useAuthStore.getState();
      toast('로그인 성공!', 'success');
      router.push(redirectUrl || roleHome[user?.role || 'customer']);
    } catch {
      toast('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name || !selectedRole) return;
    setLoading(true);
    try {
      await signup({ email, password, name, role: selectedRole });
      toast('회원가입 완료!', 'success');
      if (selectedRole === 'organizer' || selectedRole === 'partner') {
        router.push('/signup/business');
      } else {
        router.push(roleHome[selectedRole]);
      }
    } catch {
      toast('회원가입에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">DealFlow</h1>
          <p className="text-gray-500 text-sm">계약 자동화 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Login Form */}
          {step === 'login' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">로그인</h2>
              <p className="text-sm text-gray-500 mb-6">이메일과 비밀번호를 입력하세요</p>
              <div className="space-y-4 mb-6">
                <Input
                  label="이메일"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="비밀번호"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Button fullWidth size="lg" onClick={handleLogin} loading={loading}>
                  로그인
                </Button>
                <div className="text-center">
                  <button
                    onClick={() => setStep('signup')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    계정이 없으신가요? 회원가입
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Signup Form */}
          {step === 'signup' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">회원가입</h2>
              <p className="text-sm text-gray-500 mb-6">새 계정을 만듭니다</p>
              <div className="space-y-4 mb-6">
                <Input
                  label="이름"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="이메일"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="비밀번호"
                  type="password"
                  placeholder="8자 이상 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    역할
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          selectedRole === r.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-100 text-gray-600 hover:border-gray-200'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Button fullWidth size="lg" onClick={handleSignup} loading={loading}>
                  회원가입
                </Button>
                <div className="text-center">
                  <button
                    onClick={() => setStep('login')}
                    className="text-sm text-gray-400 hover:text-gray-500"
                  >
                    이미 계정이 있으신가요? 로그인
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
