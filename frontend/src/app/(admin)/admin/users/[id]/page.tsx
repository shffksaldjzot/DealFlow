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
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  // Org edit form
  const [orgId, setOrgId] = useState<string | null>(null);
  const [bizNum1, setBizNum1] = useState('');
  const [bizNum2, setBizNum2] = useState('');
  const [bizNum3, setBizNum3] = useState('');
  const [orgPhone1, setOrgPhone1] = useState('');
  const [orgPhone2, setOrgPhone2] = useState('');
  const [orgPhone3, setOrgPhone3] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);

  const parsePhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length >= 10) {
      return { p1: digits.slice(0, 3), p2: digits.slice(3, digits.length - 4), p3: digits.slice(digits.length - 4) };
    }
    return { p1: '', p2: '', p3: '' };
  };

  const parseBizNum = (biz: string) => {
    const digits = biz.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      return { b1: digits.slice(0, 3), b2: digits.slice(3, 5), b3: digits.slice(5) };
    }
    return { b1: '', b2: '', b3: '' };
  };

  const fetchUser = () => {
    setLoading(true);
    api.get(`/admin/users/${id}`)
      .then((res) => {
        const data = extractData<UserDetail>(res);
        setUser(data);
        setName(data.name);
        setRole(data.role);
        setStatus(data.status);
        const ph = parsePhone(data.phone || '');
        setPhone1(ph.p1); setPhone2(ph.p2); setPhone3(ph.p3);

        // Load org data if available
        const membership = data.organizationMemberships?.[0];
        if (membership?.organization) {
          const org = membership.organization;
          setOrgId(org.id);
          const biz = parseBizNum(org.businessNumber || '');
          setBizNum1(biz.b1); setBizNum2(biz.b2); setBizNum3(biz.b3);
          const oph = parsePhone(org.contactPhone || '');
          setOrgPhone1(oph.p1); setOrgPhone2(oph.p2); setOrgPhone3(oph.p3);
          setOrgEmail(org.contactEmail || '');
        }
      })
      .catch(() => toast('사용자를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleSave = async () => {
    const phone = phone1 && phone2 && phone3 ? `${phone1}-${phone2}-${phone3}` : '';
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}`, { name, role, status, phone: phone || undefined });
      toast('사용자 정보가 수정되었습니다.', 'success');
      fetchUser();
    } catch {
      toast('수정에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!orgId) return;
    const businessNumber = bizNum1 && bizNum2 && bizNum3 ? `${bizNum1}-${bizNum2}-${bizNum3}` : undefined;
    const contactPhone = orgPhone1 && orgPhone2 && orgPhone3 ? `${orgPhone1}-${orgPhone2}-${orgPhone3}` : undefined;
    const payload: Record<string, any> = {};
    if (businessNumber) payload.businessNumber = businessNumber;
    if (contactPhone) payload.contactPhone = contactPhone;
    if (orgEmail) payload.contactEmail = orgEmail;
    setSavingOrg(true);
    try {
      await api.patch(`/admin/organizations/${orgId}`, payload);
      toast('업체 정보가 수정되었습니다.', 'success');
      fetchUser();
    } catch {
      toast('업체 정보 수정에 실패했습니다.', 'error');
    } finally {
      setSavingOrg(false);
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

  const handleApproveUser = async () => {
    try {
      await api.patch(`/admin/users/${id}/approve`);
      toast('가입이 승인되었습니다.', 'success');
      fetchUser();
    } catch {
      toast('승인에 실패했습니다.', 'error');
    }
  };

  const roleOptions = [
    { value: 'customer', label: '고객' },
    { value: 'partner', label: '협력업체' },
    { value: 'organizer', label: '주관사' },
    { value: 'admin', label: '관리자' },
  ];

  const statusOptions = [
    { value: 'pending', label: '승인대기' },
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
            {(user.status === 'pending' ||
              ((user.role === 'partner' || user.role === 'organizer') &&
               user.organizationMemberships?.some((m: any) => m.organization?.status === 'pending'))) && (
              <Button size="sm" onClick={handleApproveUser}>가입 승인</Button>
            )}
            {(user.role === 'partner' || user.role === 'organizer') &&
              !user.organizationMemberships?.length && user.status === 'active' && (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">업체 등록 미완료</span>
            )}
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
            <div className="grid grid-cols-[3fr_auto_4fr_auto_4fr] items-center gap-1">
              <input
                type="text" inputMode="numeric" placeholder="010" maxLength={3}
                value={phone1}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 3); setPhone1(v); if (v.length === 3) document.getElementById('adm-ph2')?.focus(); }}
                className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input
                id="adm-ph2" type="text" inputMode="numeric" placeholder="0000" maxLength={4}
                value={phone2}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setPhone2(v); if (v.length === 4) document.getElementById('adm-ph3')?.focus(); }}
                className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input
                id="adm-ph3" type="text" inputMode="numeric" placeholder="0000" maxLength={4}
                value={phone3}
                onChange={(e) => { setPhone3(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
                className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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

      {/* Organization Memberships - Editable */}
      {user.organizationMemberships && user.organizationMemberships.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">소속 조직</h3>
          {user.organizationMemberships.map((m: any) => (
            <div key={m.id}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">{m.organization?.name || '-'}</p>
                <Badge status={m.organization?.status || ''} />
              </div>
              <p className="text-xs text-gray-400 mb-3">{m.organization?.type} / {m.role}</p>

              <div className="space-y-4">
                {/* 사업자등록번호 - 3-2-5 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">사업자등록번호</label>
                  <div className="grid grid-cols-[3fr_auto_2fr_auto_5fr] items-center gap-1">
                    <input
                      type="text" inputMode="numeric" placeholder="000" maxLength={3}
                      value={bizNum1}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 3); setBizNum1(v); if (v.length === 3) document.getElementById('adm-biz2')?.focus(); }}
                      className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      id="adm-biz2" type="text" inputMode="numeric" placeholder="00" maxLength={2}
                      value={bizNum2}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setBizNum2(v); if (v.length === 2) document.getElementById('adm-biz3')?.focus(); }}
                      className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      id="adm-biz3" type="text" inputMode="numeric" placeholder="00000" maxLength={5}
                      value={bizNum3}
                      onChange={(e) => { setBizNum3(e.target.value.replace(/\D/g, '').slice(0, 5)); }}
                      className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 업체 연락처 - 3-4-4 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">업체 연락처</label>
                  <div className="grid grid-cols-[3fr_auto_4fr_auto_4fr] items-center gap-1">
                    <input
                      type="text" inputMode="numeric" placeholder="010" maxLength={3}
                      value={orgPhone1}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 3); setOrgPhone1(v); if (v.length === 3) document.getElementById('adm-oph2')?.focus(); }}
                      className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      id="adm-oph2" type="text" inputMode="numeric" placeholder="0000" maxLength={4}
                      value={orgPhone2}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setOrgPhone2(v); if (v.length === 4) document.getElementById('adm-oph3')?.focus(); }}
                      className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      id="adm-oph3" type="text" inputMode="numeric" placeholder="0000" maxLength={4}
                      value={orgPhone3}
                      onChange={(e) => { setOrgPhone3(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
                      className="w-full min-w-0 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 업체 이메일 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">업체 이메일</label>
                  <Input value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="company@example.com" />
                </div>

                {m.organization?.representativeName && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">대표자</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600">{m.organization.representativeName}</div>
                  </div>
                )}

                {m.organization?.items && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">취급품목</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-600">{m.organization.items}</div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Button onClick={handleSaveOrg} disabled={savingOrg}>
                  {savingOrg ? '저장 중...' : '업체 정보 저장'}
                </Button>
              </div>
            </div>
          ))}
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
