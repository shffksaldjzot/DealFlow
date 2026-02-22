'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { IcContract } from '@/types/integrated-contract';

export default function CustomerIntegratedContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<IcContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ic/contracts/my')
      .then((res) => setContracts(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="통합 계약" />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-gray-300" />}
          title="통합 계약 내역이 없습니다"
          description="행사에서 옵션을 선택하여 계약하세요"
        />
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Card
              key={c.id}
              hoverable
              onClick={() => router.push(`/customer/integrated-contracts/${c.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge status={c.status} />
                    <span className="text-xs font-mono text-gray-400">{c.shortCode}</span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">
                    {c.config?.event?.name || '행사'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.apartmentType?.name} · {c.selectedItems?.length || 0}개 품목
                  </p>
                  {c.selectedItems && c.selectedItems.length > 0 && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {c.selectedItems.map(item => item.optionName).slice(0, 3).join(', ')}
                      {c.selectedItems.length > 3 && ` 외 ${c.selectedItems.length - 3}건`}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-bold text-blue-600">{formatCurrency(c.totalAmount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
