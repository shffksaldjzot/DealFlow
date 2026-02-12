'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { UserRole } from '@/types/user';
import { Building2, Users, Briefcase, ShieldCheck } from 'lucide-react';

const roles = [
  { value: 'customer' as UserRole, label: '고객', desc: '계약 확인 및 서명', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'organizer' as UserRole, label: '주관사', desc: '행사 생성 및 관리', icon: Building2, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { value: 'partner' as UserRole, label: '협력업체', desc: '계약 생성 및 QR 발급', icon: Briefcase, color: 'bg-green-50 text-green-600 border-green-200' },
  { value: 'admin' as UserRole, label: '관리자', desc: '전체 시스템 관리', icon: ShieldCheck, color: 'bg-orange-50 text-orange-600 border-orange-200' },
];

export default function LoginPage() {
  const [step, setStep] = useState<'role' | 'login' | 'signup'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      toast('로그인 성공!', 'success');
      const roleHome: Record<string, string> = {
        customer: '/customer',
        organizer: '/organizer',
        partner: '/partner',
        admin: '/admin',
      };
      // We'll navigate after fetchMe updates the store
      router.push(roleHome[selectedRole || 'customer']);
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
        const roleHome: Record<string, string> = {
          customer: '/customer',
          admin: '/admin',
        };
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
          {/* Step 1: Role Selection */}
          {step === 'role' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">시작하기</h2>
              <p className="text-sm text-gray-500 mb-6">역할을 선택해주세요</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      onClick={() => setSelectedRole(r.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === r.value
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${r.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
              <Button
                fullWidth
                size="lg"
                disabled={!selectedRole}
                onClick={() => setStep('login')}
              >
                다음
              </Button>
            </>
          )}

          {/* Step 2: Login Form */}
          {step === 'login' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">로그인</h2>
              <p className="text-sm text-gray-500 mb-6">
                {roles.find((r) => r.value === selectedRole)?.label}으로 로그인합니다
              </p>
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
                {selectedRole === 'customer' && (
                  <Button
                    fullWidth
                    size="lg"
                    variant="outline"
                    className="bg-[#FEE500] border-[#FEE500] text-[#191919] hover:bg-[#FDD800]"
                    onClick={() => toast('카카오 로그인은 OAuth 설정 후 사용 가능합니다.', 'info')}
                  >
                    카카오로 시작하기
                  </Button>
                )}
                <div className="text-center">
                  <button
                    onClick={() => setStep('signup')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    계정이 없으신가요? 회원가입
                  </button>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => { setStep('role'); setSelectedRole(null); }}
                    className="text-sm text-gray-400 hover:text-gray-500"
                  >
                    역할 다시 선택
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Signup Form */}
          {step === 'signup' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">회원가입</h2>
              <p className="text-sm text-gray-500 mb-6">
                {roles.find((r) => r.value === selectedRole)?.label} 계정을 만듭니다
              </p>
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
