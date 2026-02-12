'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import { FileText, ChevronRight } from 'lucide-react';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name || '고객'}님
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          계약 현황을 확인하세요
        </p>
      </div>

      {/* Quick Actions */}
      <Card hoverable onClick={() => router.push('/customer/contracts')} className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">내 계약</p>
              <p className="text-sm text-gray-500">계약 내역을 확인하세요</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 rounded-2xl p-5 mt-6">
        <p className="text-sm font-medium text-blue-800 mb-1">QR 코드로 계약하기</p>
        <p className="text-sm text-blue-600">
          협력업체에서 제공한 QR 코드를 스캔하면 바로 계약을 진행할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
