'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ContractLoginPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { login, signup } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
      router.push(`/contract/${code}/view`);
    } catch {
      toast('로그인에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      await signup({ email, password, name, role: 'customer' });
      router.push(`/contract/${code}/view`);
    } catch {
      toast('회원가입에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">DealFlow</h1>
          <p className="text-sm text-gray-500 mt-2">
            계약을 진행하려면 로그인이 필요합니다
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {mode === 'login' ? (
            <>
              <div className="space-y-4 mb-6">
                <Input label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                <Input label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
              </div>
              <Button fullWidth size="lg" onClick={handleLogin} loading={loading}>로그인</Button>
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                className="mt-2 bg-[#FEE500] border-[#FEE500] text-[#191919] hover:bg-[#FDD800]"
                onClick={() => toast('카카오 OAuth 설정 후 사용 가능합니다.', 'info')}
              >
                카카오로 시작하기
              </Button>
              <p className="text-center text-sm text-gray-500 mt-4">
                계정이 없으신가요?{' '}
                <button onClick={() => setMode('signup')} className="text-blue-600 font-medium">회원가입</button>
              </p>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
                <Input label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                <Input label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" />
              </div>
              <Button fullWidth size="lg" onClick={handleSignup} loading={loading}>회원가입</Button>
              <p className="text-center text-sm text-gray-500 mt-4">
                이미 계정이 있으신가요?{' '}
                <button onClick={() => setMode('login')} className="text-blue-600 font-medium">로그인</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
