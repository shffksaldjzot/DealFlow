'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { FileText, ChevronRight, Layers } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';
import type { IcContract } from '@/types/integrated-contract';

export default function CustomerContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [icContracts, setIcContracts] = useState<IcContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'regular' | 'ic'>('all');

  useEffect(() => {
    Promise.all([
      api.get('/customer/contracts').then((res) => setContracts(extractData(res))).catch(() => {}),
      api.get('/ic/contracts/my').then((res) => setIcContracts(extractData(res))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const hasAny = contracts.length > 0 || icContracts.length > 0;

  return (
    <div>
      <PageHeader title="내 계약" backHref="/customer" />

      {/* Tabs */}
      {!loading && hasAny && (
        <div className="flex gap-2 mb-4">
          {(['all', 'regular', 'ic'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[32px] ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? `전체 (${contracts.length + icContracts.length})` :
               t === 'regular' ? `개별계약 (${contracts.length})` :
               `통합계약 (${icContracts.length})`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : !hasAny ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-gray-400" />}
          title="계약 내역이 없습니다"
          description="QR 코드를 스캔하여 계약을 진행해보세요"
        />
      ) : (
        <div className="space-y-2.5">
          {/* Regular contracts */}
          {(tab === 'all' || tab === 'regular') && contracts.map((c) => (
            <Card
              key={c.id}
              hoverable
              onClick={() => router.push(`/customer/contracts/${c.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
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
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge status={c.status} />
                    <span className="text-xs text-gray-400">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </div>
            </Card>
          ))}

          {/* Integrated contracts */}
          {(tab === 'all' || tab === 'ic') && icContracts.map((ic) => (
            <Card
              key={ic.id}
              hoverable
              onClick={() => router.push(`/customer/integrated-contracts/${ic.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-mono text-gray-400">{ic.shortCode}</span>
                  </div>
                  <p className="font-semibold text-gray-800 mt-0.5 truncate">
                    {(ic as any).config?.event?.name || '통합계약서'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(ic as any).apartmentType?.name} · {ic.selectedItems?.length || 0}개 품목
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge status={ic.status} />
                    <span className="text-xs text-gray-400">
                      {formatDateTime(ic.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-bold text-blue-600 text-sm">{formatCurrency(ic.totalAmount)}</p>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto mt-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
