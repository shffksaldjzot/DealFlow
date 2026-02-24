'use client';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Clock } from 'lucide-react';

export default function PendingApproval() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">승인 대기 중</h1>
        <p className="text-gray-500 mb-8">
          업체 등록 신청이 완료되었습니다.
          <br />
          DealFlow 승인 후 서비스를 이용하실 수 있습니다.
          <br />
          <span className="text-sm text-gray-400 mt-2 block">
            승인까지 영업일 기준 1~2일 소요됩니다.
          </span>
        </p>
        <Button variant="secondary" onClick={() => router.push('/login')}>
          로그인 페이지로
        </Button>
      </div>
    </div>
  );
}
