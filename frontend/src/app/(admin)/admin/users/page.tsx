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
import { formatDateTime } from '@/lib/utils';
import type { User, UserStatus } from '@/types/user';
import type { PaginatedResult } from '@/types/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<{ id: string; name: string; currentStatus: UserStatus } | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', name: '', role: 'customer' });
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password || !createForm.name) {
      toast('모든 필드를 입력해주세요.', 'error');
      return;
    }
    if (createForm.password.length < 8) {
      toast('비밀번호는 8자 이상이어야 합니다.', 'error');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', createForm);
      toast('계정이 생성되었습니다.', 'success');
      setCreateModal(false);
      setCreateForm({ email: '', password: '', name: '', role: 'customer' });
      fetchUsers();
    } catch (err: any) {
      toast(err.response?.data?.message || '계정 생성에 실패했습니다.', 'error');
    } finally {
      setCreating(false);
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
      render: (u: User) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); router.push(`/admin/users/${u.id}`); }}
          >
            상세
          </Button>
          {u.role !== 'admin' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setStatusModal({ id: u.id, name: u.name, currentStatus: u.status }); }}
            >
              상태
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="사용자 관리"
        subtitle={`총 ${total}명`}
        actions={
          <Button size="sm" onClick={() => setCreateModal(true)}>계정 생성</Button>
        }
      />

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
        <Table
          columns={columns}
          data={users}
          emptyMessage="사용자가 없습니다."
          onRowClick={(u: User) => router.push(`/admin/users/${u.id}`)}
        />
      )}

      {/* Status Change Modal */}
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

      {/* Create User Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="계정 생성">
        <div className="space-y-4">
          <Input
            label="이메일"
            type="email"
            placeholder="email@example.com"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="8자 이상"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          />
          <Input
            label="이름"
            placeholder="홍길동"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">역할</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="customer">고객</option>
              <option value="partner">협력업체</option>
              <option value="organizer">주관사</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCreateModal(false)}>취소</Button>
            <Button onClick={handleCreate} loading={creating}>생성</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
