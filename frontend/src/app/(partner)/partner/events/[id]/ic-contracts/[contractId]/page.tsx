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

export default function PartnerIcContractDetailPage() {
  const { id: eventId, contractId } = useParams<{ id: string; contractId: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<IcContract | null>(null);
  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/ic/contracts/${contractId}`).then((res) => extractData<IcContract>(res)),
      api.get('/users/profile').then((res) => res.data?.data).catch(() => null),
    ])
      .then(async ([contractData, profile]) => {
        setContract(contractData);
        if (profile?.organizationMemberships?.[0]?.organization?.name) {
          setPartnerName(profile.organizationMemberships[0].organization.name);
        }
        // Load flow for commission rates
        if (contractData.config?.eventId) {
          try {
            const flowRes = await api.get(`/ic/contract-flow/${contractData.config.eventId}`);
            setFlow(extractData(flowRes));
          } catch {}
        }
      })
      .catch(() => router.push(`/partner/events/${eventId}/ic-contracts`))
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

  // Filter items for this partner
  const myItems = partnerName
    ? contract.selectedItems.filter((item) => item.partnerName === partnerName)
    : contract.selectedItems;

  const filteredContract: IcContract = {
    ...contract,
    selectedItems: myItems,
  };

  // Commission calculation
  const commissionMap = new Map<string, number>();
  if (flow) {
    for (const partner of flow.partners) {
      for (const cat of partner.categories) {
        commissionMap.set(cat.sheetId, cat.commissionRate || 0);
      }
    }
  }

  const myRevenue = myItems.reduce((sum, item) => sum + Number(item.unitPrice), 0);
  const myCommission = myItems.reduce((sum, item) => {
    const rate = commissionMap.get(item.sheetId) || 0;
    return sum + (Number(item.unitPrice) * rate / 100);
  }, 0);

  return (
    <>
      <div className="print-hidden">
        <PageHeader
          title={`통합 계약 ${contract.shortCode}`}
          subtitle={`${contract.customerName || '고객'} - 내 품목만 표시`}
          backHref={`/partner/events/${eventId}/ic-contracts`}
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

        {/* Commission Summary */}
        {myCommission > 0 && (
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">내 매출</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(myRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">수수료율</p>
                <p className="text-lg font-bold text-gray-600">
                  {[...new Set(myItems.map(item => commissionMap.get(item.sheetId) || 0))].join('/')}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">수수료</p>
                <p className="text-lg font-bold text-error">{formatCurrency(Math.round(myCommission))}</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <ContractPreview contract={filteredContract} />
        </Card>
      </div>

      {/* Print View - partner filtered */}
      <div className="hidden" style={{ display: 'none' }}>
        <div className="ic-print-container">
          <IcContractPrintView contract={contract} partnerFilter={partnerName || undefined} />
        </div>
      </div>
    </>
  );
}
