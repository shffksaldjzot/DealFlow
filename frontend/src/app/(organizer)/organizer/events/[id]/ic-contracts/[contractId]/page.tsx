'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import ContractPreview from '@/components/integrated-contract/ContractPreview';
import IcContractPrintView from '@/components/integrated-contract/IcContractPrintView';
import type { IcContract } from '@/types/integrated-contract';

export default function OrganizerIcContractDetailPage() {
  const { id: eventId, contractId } = useParams<{ id: string; contractId: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<IcContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ic/contracts/${contractId}`)
      .then((res) => setContract(extractData(res)))
      .catch(() => router.push(`/organizer/events/${eventId}/ic-contracts`))
      .finally(() => setLoading(false));
  }, [contractId, eventId, router]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!contract) return null;

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
        <Card>
          <ContractPreview contract={contract} />
        </Card>
      </div>

      {/* Print View */}
      <div className="hidden" style={{ display: 'none' }}>
        <div className="ic-print-container">
          <IcContractPrintView contract={contract} />
        </div>
      </div>
    </>
  );
}
