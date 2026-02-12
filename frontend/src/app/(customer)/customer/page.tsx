'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { FileText, ChevronRight, QrCode } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Contract } from '@/types/contract';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customer/contracts')
      .then((res) => setContracts(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <p className="text-xs text-gray-500">전체 계약</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '-' : contracts.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">서명 완료</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {loading ? '-' : contracts.filter((c) => c.status === 'signed' || c.status === 'completed').length}
          </p>
        </Card>
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

      {/* Recent Contracts */}
      {!loading && contracts.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6">최근 계약</h3>
          <div className="space-y-2">
            {contracts.slice(0, 3).map((c) => (
              <Card key={c.id} hoverable onClick={() => router.push(`/customer/contracts/${c.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                    <p className="font-medium text-gray-900 text-sm mt-0.5">{c.event?.name || '계약서'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge status={c.status} />
                      <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

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
