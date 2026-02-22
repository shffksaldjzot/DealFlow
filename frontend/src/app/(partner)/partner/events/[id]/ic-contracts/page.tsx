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

export default function PartnerIcContractsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<IcContract[]>([]);
  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ic/contracts/partner/my').then((res) => extractData<IcContract[]>(res)),
      api.get(`/ic/contract-flow/${eventId}`).then((res) => extractData<IcContractFlow>(res)).catch(() => null),
      api.get('/users/profile').then((res) => res.data?.data).catch(() => null),
    ])
      .then(([all, flowData, profile]) => {
        const filtered = all.filter((c) => c.config?.event?.id === eventId || c.config?.eventId === eventId);
        setContracts(filtered);
        setFlow(flowData);
        if (profile?.organizationMemberships?.[0]?.organization?.name) {
          setPartnerName(profile.organizationMemberships[0].organization.name);
        }
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

  // Calculate per-contract stats
  const getMyRevenue = (contract: IcContract) => {
    const items = partnerName
      ? contract.selectedItems.filter((item) => item.partnerName === partnerName)
      : contract.selectedItems;
    return items.reduce((sum, item) => sum + Number(item.unitPrice), 0);
  };

  const getMyCommission = (contract: IcContract) => {
    const items = partnerName
      ? contract.selectedItems.filter((item) => item.partnerName === partnerName)
      : contract.selectedItems;
    return items.reduce((sum, item) => {
      const rate = commissionMap.get(item.sheetId) || 0;
      return sum + (Number(item.unitPrice) * rate / 100);
    }, 0);
  };

  const totalRevenue = contracts.reduce((sum, c) => sum + getMyRevenue(c), 0);
  const totalCommission = contracts.reduce((sum, c) => sum + getMyCommission(c), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

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
        <span className="font-mono font-medium text-gray-900 text-xs">{item.shortCode}</span>
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
      key: 'myRevenue',
      header: '내 매출',
      render: (item: IcContract) => (
        <span className="font-medium text-gray-900">{formatCurrency(getMyRevenue(item))}</span>
      ),
    },
    {
      key: 'commission',
      header: '수수료',
      render: (item: IcContract) => {
        const commission = getMyCommission(item);
        return commission > 0
          ? <span className="text-red-600 font-medium">{formatCurrency(Math.round(commission))}</span>
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
        subtitle="내 품목이 포함된 계약 목록"
        backHref={`/partner/events/${eventId}`}
      />

      {/* Stats */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <p className="text-xs text-gray-500">총 계약</p>
            <p className="text-xl font-bold text-gray-900">{contracts.length}건</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">내 매출 합계</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500">수수료 합계</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(Math.round(totalCommission))}</p>
          </Card>
        </div>
      )}

      {contracts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-12 h-12 text-gray-300" />}
            title="관련 통합 계약이 없습니다"
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
              onRowClick={(item: IcContract) => router.push(`/partner/events/${eventId}/ic-contracts/${item.id}`)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
