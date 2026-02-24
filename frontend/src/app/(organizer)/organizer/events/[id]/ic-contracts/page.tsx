'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import Table from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { IcContract, IcContractFlow } from '@/types/integrated-contract';

export default function OrganizerIcContractsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<IcContract[]>([]);
  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/ic/contracts/event/${eventId}`).then((res) => extractData<IcContract[]>(res)),
      api.get(`/ic/contract-flow/${eventId}`).then((res) => extractData<IcContractFlow>(res)).catch(() => null),
    ])
      .then(([contractsData, flowData]) => {
        setContracts(contractsData);
        setFlow(flowData);
      })
      .catch(() => toast('데이터를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [eventId, toast]);

  // Build commission rate map: sheetId -> commissionRate
  const commissionMap = new Map<string, number>();
  if (flow) {
    for (const partner of flow.partners) {
      for (const cat of partner.categories) {
        commissionMap.set(cat.sheetId, cat.commissionRate || 0);
      }
    }
  }

  const getCommission = (contract: IcContract) => {
    return (contract.selectedItems || []).reduce((sum, item) => {
      const rate = commissionMap.get(item.sheetId) || 0;
      return sum + (Number(item.unitPrice) * rate / 100);
    }, 0);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const totalAmount = contracts.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
  const totalCommission = contracts.reduce((sum, c) => sum + getCommission(c), 0);
  const signedCount = contracts.filter((c) => c.status === 'signed' || c.status === 'completed').length;

  const columns = [
    {
      key: 'status',
      header: '상태',
      render: (item: IcContract) => <Badge status={item.status} />,
    },
    {
      key: 'shortCode',
      header: '계약번호',
      render: (item: IcContract) => (
        <span className="font-mono font-medium text-gray-800 text-xs">{item.shortCode}</span>
      ),
    },
    {
      key: 'customer',
      header: '고객',
      render: (item: IcContract) => (
        <span className="text-gray-700">{item.customerName || item.customer?.name || '-'}</span>
      ),
    },
    {
      key: 'type',
      header: '타입',
      render: (item: IcContract) => (
        <span className="text-gray-600">{item.apartmentType?.name || '-'}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: '금액',
      render: (item: IcContract) => (
        <span className="font-medium text-gray-800">{formatCurrency(item.totalAmount)}</span>
      ),
    },
    {
      key: 'commission',
      header: '수수료',
      render: (item: IcContract) => {
        const commission = getCommission(item);
        return commission > 0
          ? <span className="text-orange-600 font-medium">{formatCurrency(Math.round(commission))}</span>
          : <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'createdAt',
      header: '체결일',
      className: 'hidden sm:table-cell',
      render: (item: IcContract) => (
        <span className="text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="통합 계약 현황"
        backHref={`/organizer/events/${eventId}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <p className="text-xs text-gray-500">총 계약</p>
          <p className="text-xl font-bold text-gray-800">{contracts.length}건</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">체결 완료</p>
          <p className="text-xl font-bold text-success">{signedCount}건</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">총 금액</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">총 수수료</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(Math.round(totalCommission))}</p>
        </Card>
      </div>

      {/* Table */}
      {contracts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-12 h-12 text-gray-300" />}
            title="통합 계약이 없습니다"
            description="고객이 옵션을 선택하여 계약하면 여기에 표시됩니다"
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={contracts}
              emptyMessage="계약이 없습니다."
              onRowClick={(item: IcContract) => router.push(`/organizer/events/${eventId}/ic-contracts/${item.id}`)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
