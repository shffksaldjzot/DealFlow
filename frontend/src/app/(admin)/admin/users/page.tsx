'use client';
import { useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';
import type { User, UserStatus } from '@/types/user';
import type { PaginatedResult } from '@/types/api';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<{ id: string; name: string; currentStatus: UserStatus } | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users', { params: { page, limit: 20, search } })
      .then((res) => {
        const result = extractData<PaginatedResult<User>>(res);
        setUsers(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleStatusChange = async (status: UserStatus) => {
    if (!statusModal) return;
    try {
      await api.patch(`/admin/users/${statusModal.id}/status`, { status });
      toast(status === 'active' ? '사용자가 활성화되었습니다.' : '사용자가 정지되었습니다.', 'success');
      setStatusModal(null);
      fetchUsers();
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: '관리자',
      organizer: '주관사',
      partner: '파트너',
      customer: '고객',
    };
    const colorMap: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      organizer: 'bg-blue-100 text-blue-800',
      partner: 'bg-green-100 text-green-800',
      customer: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[role] || 'bg-gray-100 text-gray-600'}`}>
        {map[role] || role}
      </span>
    );
  };

  const columns = [
    { key: 'name', header: '이름' },
    { key: 'email', header: '이메일' },
    { key: 'role', header: '역할', render: (u: User) => getRoleBadge(u.role) },
    { key: 'status', header: '상태', render: (u: User) => <Badge status={u.status} /> },
    { key: 'createdAt', header: '가입일', render: (u: User) => formatDateTime(u.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (u: User) =>
        u.role !== 'admin' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStatusModal({ id: u.id, name: u.name, currentStatus: u.status })}
          >
            상태 변경
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="사용자 관리" subtitle={`총 ${total}명`} />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <Table columns={columns} data={users} emptyMessage="사용자가 없습니다." />
      )}

      <Modal
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={`${statusModal?.name} 상태 변경`}
      >
        <p className="text-sm text-gray-600 mb-4">
          현재 상태: <Badge status={statusModal?.currentStatus || ''} />
        </p>
        <div className="flex gap-2">
          {statusModal?.currentStatus !== 'active' && (
            <Button className="flex-1" onClick={() => handleStatusChange('active')}>
              활성화
            </Button>
          )}
          {statusModal?.currentStatus !== 'suspended' && (
            <Button variant="danger" className="flex-1" onClick={() => handleStatusChange('suspended')}>
              정지
            </Button>
          )}
        </div>
        <div className="mt-3">
          <Button variant="secondary" fullWidth onClick={() => setStatusModal(null)}>
            취소
          </Button>
        </div>
      </Modal>
    </div>
  );
}
