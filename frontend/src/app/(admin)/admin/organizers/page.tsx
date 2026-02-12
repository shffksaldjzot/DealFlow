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
import { CheckCircle2, XCircle, Search } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Organization } from '@/types/organization';
import type { PaginatedResult } from '@/types/api';

export default function AdminOrganizersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOrgs = () => {
    setLoading(true);
    api.get('/admin/organizers', { params: { page, limit: 20, search } })
      .then((res) => {
        const result = extractData<PaginatedResult<Organization>>(res);
        setOrgs(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrgs(); }, [page, search]);

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

  const columns = [
    { key: 'name', header: '업체명' },
    { key: 'businessNumber', header: '사업자번호' },
    { key: 'representativeName', header: '대표자', render: (o: Organization) => o.representativeName || '-' },
    { key: 'status', header: '상태', render: (o: Organization) => <Badge status={o.status} /> },
    { key: 'createdAt', header: '등록일', render: (o: Organization) => formatDateTime(o.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (o: Organization) =>
        o.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleApprove(o.id)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              승인
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setRejectModal({ id: o.id, name: o.name })}
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
      <PageHeader title="주관사 관리" subtitle={`총 ${total}개 업체`} />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="업체명 또는 사업자번호 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Table columns={columns} data={orgs} />

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
    </div>
  );
}
