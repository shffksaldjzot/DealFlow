'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { CheckCircle2, XCircle, Download, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Organization } from '@/types/organization';
import type { PaginatedResult } from '@/types/api';

const statusTabs = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
];

export default function AdminOrganizersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailOrg, setDetailOrg] = useState<Organization | null>(null);

  const fetchOrgs = () => {
    setLoading(true);
    api.get('/admin/organizers', { params: { page, limit: 20, search, status: statusFilter } })
      .then((res) => {
        const result = extractData<PaginatedResult<Organization>>(res);
        setOrgs(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrgs(); }, [page, search, statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/admin/organizers/${id}/approve`);
      toast('승인되었습니다.', 'success');
      fetchOrgs();
    } catch {
      toast('승인에 실패했습니다.', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return;
    try {
      await api.patch(`/admin/organizers/${rejectModal.id}/reject`, { reason: rejectReason });
      toast('거절되었습니다.', 'success');
      setRejectModal(null);
      setRejectReason('');
      fetchOrgs();
    } catch {
      toast('거절에 실패했습니다.', 'error');
    }
  };

  const handleLicenseDownload = (fileId: string, orgName: string) => {
    window.open(`/api/files/${fileId}/download`, '_blank');
  };

  const getTypeBadge = (type: string) => {
    if (type === 'organizer') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">주관사</span>;
    if (type === 'partner') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">협력업체</span>;
    return <span className="text-xs text-gray-500">{type}</span>;
  };

  const columns = [
    { key: 'name', header: '업체명' },
    { key: 'type', header: '구분', render: (o: Organization) => getTypeBadge((o as any).type) },
    { key: 'businessNumber', header: '사업자번호' },
    { key: 'representativeName', header: '대표자', render: (o: Organization) => o.representativeName || '-' },
    {
      key: 'contact', header: '연락처', render: (o: Organization) => (
        <div className="text-xs">
          {o.contactPhone && <p>{o.contactPhone}</p>}
          {o.contactEmail && <p className="text-gray-400">{o.contactEmail}</p>}
          {!o.contactPhone && !o.contactEmail && <span className="text-gray-300">-</span>}
        </div>
      ),
    },
    { key: 'status', header: '상태', render: (o: Organization) => <Badge status={o.status} /> },
    { key: 'createdAt', header: '등록일', render: (o: Organization) => formatDateTime(o.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (o: Organization) =>
        o.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleApprove(o.id); }}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              승인
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRejectModal({ id: o.id, name: o.name }); }}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              거절
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="가입 승인/관리" subtitle={`총 ${total}개 업체`} />

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 max-w-md">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="업체명 또는 사업자번호 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Table
        columns={columns}
        data={orgs}
        onRowClick={(o) => setDetailOrg(o)}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title={`${rejectModal?.name} 거절`}
      >
        <Input
          label="거절 사유"
          placeholder="거절 사유를 입력하세요"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1" onClick={() => setRejectModal(null)}>
            취소
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleReject} disabled={!rejectReason}>
            거절 확인
          </Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailOrg}
        onClose={() => setDetailOrg(null)}
        title={detailOrg?.name || '업체 상세'}
      >
        {detailOrg && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getTypeBadge((detailOrg as any).type)}
              <Badge status={detailOrg.status} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">사업자번호</p>
                  <p className="text-sm font-medium">{detailOrg.businessNumber}</p>
                </div>
              </div>
              {detailOrg.representativeName && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">대표자</p>
                    <p className="text-sm font-medium">{detailOrg.representativeName}</p>
                  </div>
                </div>
              )}
              {detailOrg.contactPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">연락처</p>
                    <p className="text-sm font-medium">{detailOrg.contactPhone}</p>
                  </div>
                </div>
              )}
              {detailOrg.contactEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">이메일</p>
                    <p className="text-sm font-medium">{detailOrg.contactEmail}</p>
                  </div>
                </div>
              )}
              {detailOrg.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">주소</p>
                    <p className="text-sm font-medium">{detailOrg.address}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">등록일</p>
                <p className="text-sm">{formatDateTime(detailOrg.createdAt)}</p>
              </div>
            </div>

            {/* Business License Download */}
            {detailOrg.businessLicenseFileId && (
              <Button
                fullWidth
                variant="outline"
                onClick={() => handleLicenseDownload(detailOrg.businessLicenseFileId!, detailOrg.name)}
              >
                <Download className="w-4 h-4 mr-2" />
                사업자등록증 다운로드
              </Button>
            )}

            {/* Actions for pending */}
            {detailOrg.status === 'pending' && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button className="flex-1" onClick={() => { handleApprove(detailOrg.id); setDetailOrg(null); }}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  승인
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => { setRejectModal({ id: detailOrg.id, name: detailOrg.name }); setDetailOrg(null); }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  거절
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
