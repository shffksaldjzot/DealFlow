'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import ContractPreview from '@/components/integrated-contract/ContractPreview';
import type { IcContract } from '@/types/integrated-contract';

export default function CustomerIntegratedContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<IcContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ic/contracts/${id}`)
      .then((res) => setContract(extractData(res)))
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
    <div>
      <PageHeader
        title="계약 상세"
        backHref="/customer/integrated-contracts"
        actions={<Badge status={contract.status} />}
      />
      <Card>
        <ContractPreview contract={contract} />
      </Card>
    </div>
  );
}
