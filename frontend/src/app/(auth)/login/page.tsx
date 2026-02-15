'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
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
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const errorMessage = Array.isArray(msg) ? msg[0] : (msg || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      toast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalid = email.length > 0 && !emailRegex.test(email);
  const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;
  const signupValid =
    email && emailRegex.test(email) && password && password.length >= 8 && !passwordMismatch && passwordConfirm &&
    name && selectedRole && agreeTerms && agreePrivacy;

  const [termsModal, setTermsModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);

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
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => router.push('/forgot-password')}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                  <button
                    onClick={() => setStep('signup')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    회원가입
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
                  label={selectedRole === 'partner' ? '업체명 (담당자명)' : '이름'}
                  placeholder={selectedRole === 'partner' ? '(주)OO무역 (홍길동)' : '홍길동'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div>
                  <Input
                    label="이메일"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {emailInvalid && (
                    <p className="text-xs text-red-500 mt-1">이메일 형식으로 작성해주세요</p>
                  )}
                </div>
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
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">
                      <button type="button" onClick={() => setTermsModal(true)} className="underline text-gray-700 hover:text-blue-600">이용약관</button>에 동의합니다 <span className="text-red-500">*</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">
                      <button type="button" onClick={() => setPrivacyModal(true)} className="underline text-gray-700 hover:text-blue-600">개인정보처리방침</button>에 동의합니다 <span className="text-red-500">*</span>
                    </span>
                  </div>
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

      {/* Terms Modal */}
      <Modal isOpen={termsModal} onClose={() => setTermsModal(false)} title="이용약관" size="lg">
        <div className="max-h-[60vh] overflow-y-auto text-sm text-gray-700 space-y-4 leading-relaxed">
          <h4 className="font-bold">제1조 (목적)</h4>
          <p>본 약관은 DealFlow(이하 &quot;서비스&quot;)가 제공하는 계약 자동화 플랫폼 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          <h4 className="font-bold">제2조 (정의)</h4>
          <p>1. &quot;서비스&quot;란 DealFlow가 제공하는 계약서 생성, 전자서명, QR코드 기반 계약 관리 등 일체의 서비스를 의미합니다.</p>
          <p>2. &quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 고객, 주관사, 협력업체 등을 의미합니다.</p>
          <h4 className="font-bold">제3조 (약관의 효력 및 변경)</h4>
          <p>1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
          <p>2. 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 약관을 변경할 수 있습니다.</p>
          <h4 className="font-bold">제4조 (서비스의 제공)</h4>
          <p>1. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</p>
          <p>2. 서비스는 시스템 정기점검, 증설 및 교체를 위해 서비스가 일시 중단될 수 있으며, 예정된 작업으로 인한 서비스 일시 중단은 사전에 공지합니다.</p>
          <h4 className="font-bold">제5조 (이용자의 의무)</h4>
          <p>1. 이용자는 관계법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.</p>
          <p>2. 이용자는 서비스의 이용권한, 기타 이용계약상의 지위를 타인에게 양도, 증여할 수 없습니다.</p>
          <h4 className="font-bold">제6조 (면책조항)</h4>
          <p>1. 서비스는 천재지변, 전쟁 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</p>
          <p>2. 서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해서는 책임을 지지 않습니다.</p>
        </div>
      </Modal>

      {/* Privacy Modal */}
      <Modal isOpen={privacyModal} onClose={() => setPrivacyModal(false)} title="개인정보처리방침" size="lg">
        <div className="max-h-[60vh] overflow-y-auto text-sm text-gray-700 space-y-4 leading-relaxed">
          <h4 className="font-bold">1. 개인정보의 수집 및 이용 목적</h4>
          <p>DealFlow는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
          <p>- 회원가입 및 관리: 회원 가입의사 확인, 본인 식별·인증, 회원자격 유지·관리</p>
          <p>- 서비스 제공: 계약서 생성, 전자서명 처리, QR코드 기반 계약 관리 서비스 제공</p>
          <h4 className="font-bold">2. 수집하는 개인정보 항목</h4>
          <p>- 필수항목: 이메일, 이름(업체명), 비밀번호</p>
          <p>- 선택항목: 연락처, 주소</p>
          <p>- 서비스 이용 과정에서 자동 생성/수집: IP주소, 서명 데이터, 접속 로그</p>
          <h4 className="font-bold">3. 개인정보의 보유 및 이용기간</h4>
          <p>이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 단, 관련 법령에 의해 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보존합니다.</p>
          <p>- 계약 또는 청약철회 등에 관한 기록: 5년</p>
          <p>- 대금결제 및 재화 등의 공급에 관한 기록: 5년</p>
          <p>- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</p>
          <h4 className="font-bold">4. 개인정보의 제3자 제공</h4>
          <p>DealFlow는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우와 법령의 규정에 의한 경우는 예외로 합니다.</p>
          <h4 className="font-bold">5. 개인정보의 파기</h4>
          <p>DealFlow는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
          <h4 className="font-bold">6. 정보주체의 권리</h4>
          <p>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 가입 해지를 요청할 수 있습니다.</p>
        </div>
      </Modal>
    </div>
  );
}
