'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { UserRole } from '@/types/user';

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
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
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

  const detectCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
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

  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const signupValid =
    email && password && password.length >= 8 && !passwordMismatch && passwordConfirm &&
    name && selectedRole && agreeTerms && agreePrivacy;

  const handleSignup = async () => {
    if (!signupValid) return;
    setLoading(true);
    try {
      await signup({ email, password, name, role: selectedRole });
      toast('회원가입 완료!', 'success');
      if (selectedRole === 'partner') {
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
                <div>
                  <Input
                    label="비밀번호"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={detectCapsLock}
                    onKeyUp={detectCapsLock}
                  />
                  {capsLockOn && (
                    <p className="text-xs text-orange-500 mt-1">Caps Lock이 켜져 있습니다</p>
                  )}
                </div>
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
                <div>
                  <Input
                    label="비밀번호"
                    type="password"
                    placeholder="8자 이상 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">비밀번호는 8자 이상이어야 합니다</p>
                  )}
                </div>
                <div>
                  <Input
                    label="비밀번호 확인"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                  {passwordMismatch && (
                    <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
                  )}
                </div>
                <div>
                  <input type="hidden" />
                  {selectedRole === 'partner' ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-500 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-blue-700">협력업체</p>
                        <p className="text-xs text-blue-500">행사에 참여하여 계약을 관리합니다</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('customer')}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        고객으로 변경
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="p-3 bg-blue-50 border-2 border-blue-500 rounded-xl mb-2">
                        <p className="text-sm font-medium text-blue-700">고객</p>
                        <p className="text-xs text-blue-500">계약서를 작성하고 서명합니다</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('partner')}
                        className="text-xs text-gray-500 hover:text-blue-600 underline"
                      >
                        협력업체이신가요?
                      </button>
                    </div>
                  )}
                </div>

                {/* Terms & Privacy */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-600">
                      <span className="underline text-gray-700">이용약관</span>에 동의합니다 <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-600">
                      <span className="underline text-gray-700">개인정보처리방침</span>에 동의합니다 <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleSignup}
                  loading={loading}
                  disabled={!signupValid}
                >
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
