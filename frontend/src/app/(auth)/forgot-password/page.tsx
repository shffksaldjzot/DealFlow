'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email || !phone) {
      toast('이메일과 전화번호를 모두 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, phone });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast(Array.isArray(msg) ? msg[0] : msg || '요청에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">DealFlow</h1>
          <p className="text-gray-500 text-sm">비밀번호 찾기</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {!submitted ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">비밀번호 초기화 요청</h2>
              <p className="text-sm text-gray-500 mb-6">
                가입 시 등록한 이메일과 전화번호를 입력하시면, 관리자에게 비밀번호 초기화 요청을 보내드립니다.
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
                  label="전화번호"
                  type="tel"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Button fullWidth size="lg" onClick={handleSubmit} loading={loading}>
                  초기화 요청 보내기
                </Button>
                <div className="text-center">
                  <button
                    onClick={() => router.push('/login')}
                    className="text-sm text-gray-400 hover:text-gray-500"
                  >
                    로그인으로 돌아가기
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">요청이 전송되었습니다</h3>
              <p className="text-sm text-gray-500 mb-6">
                관리자에게 비밀번호 초기화 요청을 보냈습니다.<br />
                처리가 완료되면 등록된 연락처로 임시 비밀번호를 알려드립니다.
              </p>
              <Button fullWidth onClick={() => router.push('/login')}>
                로그인으로 돌아가기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
