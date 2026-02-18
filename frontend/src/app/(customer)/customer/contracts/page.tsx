'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { FileText, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Contract } from '@/types/contract';

export default function CustomerContractsPage() {
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
      <PageHeader title="내 계약" />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-gray-400" />}
          title="계약 내역이 없습니다"
          description="QR 코드를 스캔하여 계약을 진행해보세요"
        />
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Card
              key={c.id}
              hoverable
              onClick={() => router.push(`/customer/contracts/${c.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {c.event?.name || '계약서'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-blue-600 font-medium">{c.partner?.name}</span>
                    {(c.partner as any)?.items && (
                      <span className="text-[11px] text-gray-400">
                        ({(c.partner as any).items.split(',').map((s: string) => s.trim()).join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={c.status} />
                    <span className="text-xs text-gray-400">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
