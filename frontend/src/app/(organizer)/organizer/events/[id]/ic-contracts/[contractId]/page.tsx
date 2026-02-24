'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import ContractPreview from '@/components/integrated-contract/ContractPreview';
import IcContractPrintView from '@/components/integrated-contract/IcContractPrintView';
import { formatCurrency } from '@/lib/utils';
import type { IcContract, IcContractFlow } from '@/types/integrated-contract';

export default function OrganizerIcContractDetailPage() {
  const { id: eventId, contractId } = useParams<{ id: string; contractId: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<IcContract | null>(null);
  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ic/contracts/${contractId}`)
      .then(async (res) => {
        const c = extractData<IcContract>(res);
        setContract(c);
        if (c.config?.eventId) {
          try {
            const flowRes = await api.get(`/ic/contract-flow/${c.config.eventId}`);
            setFlow(extractData(flowRes));
          } catch {}
        }
      })
      .catch(() => router.push(`/organizer/events/${eventId}/ic-contracts`))
      .finally(() => setLoading(false));
  }, [contractId, eventId, router]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!contract) return null;

  // Commission rate map
  const commissionMap = new Map<string, number>();
  if (flow) {
    for (const partner of flow.partners) {
      for (const cat of partner.categories) {
        commissionMap.set(cat.sheetId, cat.commissionRate || 0);
      }
    }
  }

  // Partner-level breakdown
  const partnerBreakdown = new Map<string, { revenue: number; commission: number }>();
  for (const item of contract.selectedItems || []) {
    const pName = item.partnerName || '미지정';
    const existing = partnerBreakdown.get(pName) || { revenue: 0, commission: 0 };
    const rate = commissionMap.get(item.sheetId) || 0;
    existing.revenue += Number(item.unitPrice);
    existing.commission += Number(item.unitPrice) * rate / 100;
    partnerBreakdown.set(pName, existing);
  }

  const totalCommission = [...partnerBreakdown.values()].reduce((sum, b) => sum + b.commission, 0);

  return (
    <>
      <div className="print-hidden">
        <PageHeader
          title={`통합 계약 ${contract.shortCode}`}
          subtitle={contract.customerName || '고객 미입력'}
          backHref={`/organizer/events/${eventId}/ic-contracts`}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                인쇄
              </button>
              <Badge status={contract.status} />
            </div>
          }
        />

        {/* Commission Breakdown */}
        {totalCommission > 0 && (
          <Card className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">파트너별 수수료</h3>
            <div className="space-y-2">
              {[...partnerBreakdown.entries()].map(([name, data]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">매출 {formatCurrency(data.revenue)}</span>
                    <span className="font-medium text-orange-600">수수료 {formatCurrency(Math.round(data.commission))}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm font-semibold">
                <span className="text-gray-800">합계</span>
                <span className="text-orange-600">{formatCurrency(Math.round(totalCommission))}</span>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <ContractPreview contract={contract} flow={flow} />
        </Card>
      </div>

      {/* Print View */}
      <div className="hidden" style={{ display: 'none' }}>
        <div className="ic-print-container">
          <IcContractPrintView contract={contract} flow={flow} />
        </div>
      </div>
    </>
  );
}
