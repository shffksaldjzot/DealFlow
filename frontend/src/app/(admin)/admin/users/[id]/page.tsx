'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';

interface UserDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  authProvider: string;
  status: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  organizationMemberships?: any[];
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Edit form
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [phone, setPhone] = useState('');

  const fetchUser = () => {
    setLoading(true);
    api.get(`/admin/users/${id}`)
      .then((res) => {
        const data = extractData<UserDetail>(res);
        setUser(data);
        setName(data.name);
        setRole(data.role);
        setStatus(data.status);
        setPhone(data.phone || '');
      })
      .catch(() => toast('사용자를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}`, { name, role, status, phone });
      toast('사용자 정보가 수정되었습니다.', 'success');
      fetchUser();
    } catch {
      toast('수정에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast('사용자가 삭제되었습니다.', 'success');
      router.push('/admin/users');
    } catch {
      toast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleResetPassword = async () => {
    setResetting(true);
    try {
      const res = await api.post(`/admin/users/${id}/reset-password`, {});
      const data = extractData<{ temporaryPassword: string }>(res);
      setResetResult(data.temporaryPassword);
      toast('비밀번호가 초기화되었습니다.', 'success');
    } catch {
      toast('비밀번호 초기화에 실패했습니다.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleStatusToggle = async (newStatus: string) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status: newStatus });
      toast(newStatus === 'active' ? '사용자가 활성화되었습니다.' : '사용자가 정지되었습니다.', 'success');
      fetchUser();
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const roleOptions = [
    { value: 'customer', label: '고객' },
    { value: 'partner', label: '협력업체' },
    { value: 'organizer', label: '주관사' },
    { value: 'admin', label: '관리자' },
  ];

  const statusOptions = [
    { value: 'active', label: '활성' },
    { value: 'suspended', label: '정지' },
    { value: 'withdrawn', label: '탈퇴' },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="사용자 상세" backHref="/admin/users" />
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="사용자 상세" backHref="/admin/users" />
        <Card><p className="text-center text-gray-500 py-8">사용자를 찾을 수 없습니다</p></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={user.name}
        subtitle={user.email}
        backHref="/admin/users"
        actions={
          <div className="flex gap-2">
            {user.status === 'active' && user.role !== 'admin' && (
              <Button variant="danger" size="sm" onClick={() => handleStatusToggle('suspended')}>정지</Button>
            )}
            {user.status === 'suspended' && (
              <Button size="sm" onClick={() => handleStatusToggle('active')}>활성화</Button>
            )}
          </div>
        }
      />

      {/* Info Card */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge status={user.status} />
          <span className="text-xs text-gray-400">가입일: {formatDateTime(user.createdAt)}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">역할</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roleOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">연락처</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">이메일</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600">{user.email}</div>
          </div>

          {user.address && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">주소</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600">{user.address}</div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
          {user.role !== 'admin' && (
            <Button variant="secondary" onClick={() => { setResetResult(null); setResetModal(true); }}>
              비밀번호 초기화
            </Button>
          )}
        </div>
      </Card>

      {/* Organization Memberships */}
      {user.organizationMemberships && user.organizationMemberships.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">소속 조직</h3>
          <div className="space-y-2">
            {user.organizationMemberships.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.organization?.name || '-'}</p>
                  <p className="text-xs text-gray-400">{m.organization?.type} / {m.role}</p>
                </div>
                <Badge status={m.organization?.status || ''} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      {user.role !== 'admin' && (
        <Card className="border-red-200">
          <h3 className="text-sm font-semibold text-red-600 mb-3">위험 영역</h3>
          <p className="text-sm text-gray-500 mb-3">이 사용자 계정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
          <Button variant="danger" onClick={() => setDeleteModal(true)}>계정 삭제</Button>
        </Card>
      )}

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="계정 삭제 확인">
        <p className="text-sm text-gray-600 mb-4">
          정말로 <strong>{user.name}</strong> 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal(false)}>취소</Button>
          <Button variant="danger" onClick={handleDelete}>삭제</Button>
        </div>
      </Modal>

      <Modal isOpen={resetModal} onClose={() => setResetModal(false)} title="비밀번호 초기화">
        {resetResult ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              비밀번호가 초기화되었습니다. 아래 임시 비밀번호를 사용자에게 전달해주세요.
            </p>
            <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-center mb-4">
              <p className="text-xs text-blue-600 font-medium mb-1">임시 비밀번호</p>
              <p className="text-2xl font-bold font-mono text-blue-900 tracking-wider select-all">
                {resetResult}
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              사용자에게 로그인 후 반드시 비밀번호를 변경하도록 안내하세요.
            </p>
            <Button fullWidth onClick={() => { navigator.clipboard.writeText(resetResult); toast('임시 비밀번호가 복사되었습니다.', 'success'); }}>
              비밀번호 복사
            </Button>
            <Button variant="secondary" fullWidth className="mt-2" onClick={() => setResetModal(false)}>
              닫기
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{user.name}</strong>의 비밀번호를 초기화하시겠습니까?
              임시 비밀번호가 자동 생성됩니다.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setResetModal(false)}>취소</Button>
              <Button onClick={handleResetPassword} loading={resetting}>초기화</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
