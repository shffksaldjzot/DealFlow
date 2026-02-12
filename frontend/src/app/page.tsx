'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import { FileText, QrCode, Shield, Bell } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const roleHome: Record<string, string> = {
        customer: '/customer',
        organizer: '/organizer',
        partner: '/partner',
        admin: '/admin',
      };
      router.push(roleHome[user.role] || '/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const features = [
    { icon: <QrCode className="w-6 h-6" />, title: 'QR 기반 계약', desc: 'QR 스캔만으로 간편하게 계약을 시작하세요' },
    { icon: <FileText className="w-6 h-6" />, title: '전자서명', desc: '터치 한 번으로 법적 효력있는 전자서명' },
    { icon: <Shield className="w-6 h-6" />, title: '안전한 보관', desc: '모든 계약서는 암호화되어 안전하게 보관됩니다' },
    { icon: <Bell className="w-6 h-6" />, title: '실시간 알림', desc: '계약 완료 시 알림톡으로 즉시 안내' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white">DealFlow</h1>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => router.push('/login')}
          >
            로그인
          </Button>
        </nav>

        <div className="relative z-10 text-center px-6 py-20 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            계약, 이제는
            <br />
            <span className="text-blue-200">터치 한 번</span>으로
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-md mx-auto">
            입주박람회부터 사전입주까지, QR 스캔으로 시작하는 스마트 계약 플랫폼
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl"
              onClick={() => router.push('/login')}
            >
              시작하기
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
          왜 DealFlow인가요?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex gap-4 p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                {f.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>DealFlow - 계약 자동화 플랫폼</p>
      </footer>
    </div>
  );
}
