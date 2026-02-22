'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import ContractPreview from '@/components/integrated-contract/ContractPreview';
import IcContractPrintView from '@/components/integrated-contract/IcContractPrintView';
import type { IcContract, IcContractFlow } from '@/types/integrated-contract';

export default function CustomerIntegratedContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<IcContract | null>(null);
  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ic/contracts/${id}`)
      .then(async (res) => {
        const c = extractData<IcContract>(res);
        setContract(c);
        // Load full flow for displaying all options with checkmarks
        if (c.config?.eventId) {
          try {
            const flowRes = await api.get(`/ic/contract-flow/${c.config.eventId}`);
            setFlow(extractData(flowRes));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/customer/integrated-contracts" />
        <Card>
          <p className="text-center text-gray-500">계약을 찾을 수 없습니다.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="print-hidden">
        <PageHeader
          title="계약 상세"
          backHref="/customer/integrated-contracts"
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
