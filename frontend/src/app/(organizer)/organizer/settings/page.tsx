'use client';
import { useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import FileUpload from '@/components/common/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { Building2, Users, FileCheck, X, Lock, Mail, MapPin } from 'lucide-react';
import type { Organization } from '@/types/organization';

declare global {
  interface Window {
    daum: any;
  }
}

export default function OrganizerSettingsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    businessNumber: '',
    representativeName: '',
    contactPhone: '',
    contactEmail: '',
    emergencyEmail: '',
    address: '',
    addressDetail: '',
    businessLicenseFileId: '',
  });
  const [licenseFileName, setLicenseFileName] = useState('');
  const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
  const [licensePreviewOpen, setLicensePreviewOpen] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Load Daum address script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.daum) {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const openAddressSearch = () => {
    if (!window.daum?.Postcode) {
      toast('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.', 'error');
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const addr = data.roadAddress || data.jibunAddress;
        setForm((prev) => ({ ...prev, address: `(${data.zonecode}) ${addr}`, addressDetail: '' }));
      },
    }).open();
  };

  useEffect(() => {
    api.get('/organizations/me')
      .then((res) => {
        const data = extractData<Organization>(res);
        setOrg(data);
        // Split address into base + detail if it contains detail after the main address
        const savedAddress = data.address || '';
        setForm({
          name: data.name || '',
          businessNumber: data.businessNumber || '',
          representativeName: data.representativeName || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          emergencyEmail: data.emergencyEmail || '',
          address: savedAddress,
          addressDetail: '',
          businessLicenseFileId: data.businessLicenseFileId || '',
        });
        // Load business license preview
        if (data.businessLicenseFileId) {
          api.get(`/files/${data.businessLicenseFileId}/download`, { responseType: 'blob' })
            .then((fileRes) => {
              const blob = fileRes.data as Blob;
              if (blob.size > 0) setLicensePreviewUrl(URL.createObjectURL(blob));
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!org) return;
    if (!form.name.trim()) {
      toast('회사명을 입력해주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      const fullAddress = form.addressDetail
        ? `${form.address} ${form.addressDetail}`
        : form.address;
      const updated = extractData<Organization>(
        await api.patch(`/organizations/${org.id}`, {
          ...form,
          address: fullAddress,
          addressDetail: undefined,
        })
      );
      setOrg(updated);
      toast('저장되었습니다.', 'success');
    } catch {
      toast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast('비밀번호를 입력해주세요.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('새 비밀번호는 8자 이상이어야 합니다.', 'error');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast('새 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      toast('비밀번호가 변경되었습니다.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err: any) {
      toast(err.response?.data?.message || '비밀번호 변경에 실패했습니다.', 'error');
    }
    setChangingPassword(false);
  };

  const passwordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;

  if (loading) {
    return (
      <div>
        <PageHeader title="마이페이지" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <div>
        <PageHeader title="마이페이지" />
        <Card>
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">등록된 업체 정보가 없습니다</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="마이페이지" subtitle="사업자 정보와 연락처를 관리할 수 있습니다" />

      {/* Business Info Card */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">사업자 정보</h3>
          <Badge status={org.status} />
        </div>
        <div className="space-y-4">
          <Input
            label="회사명"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="회사명을 입력하세요"
          />
          <Input
            label="사업자등록번호"
            value={form.businessNumber}
            onChange={(e) => setForm({ ...form, businessNumber: e.target.value })}
            placeholder="000-00-00000"
          />
          <Input
            label="대표자명"
            value={form.representativeName}
            onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
            placeholder="대표자 이름"
          />

          {/* Business License Upload + Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              사업자등록증
            </label>
            {form.businessLicenseFileId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      {licenseFileName || '사업자등록증 업로드 완료'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {licensePreviewUrl && (
                      <button
                        type="button"
                        onClick={() => setLicensePreviewOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        미리보기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, businessLicenseFileId: '' });
                        setLicenseFileName('');
                        setLicensePreviewUrl(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      변경
                    </button>
                  </div>
                </div>
                {/* Inline preview thumbnail */}
                {licensePreviewUrl && (
                  <div
                    className="rounded-xl border border-gray-200 overflow-hidden cursor-pointer"
                    onClick={() => setLicensePreviewOpen(true)}
                  >
                    <img
                      src={licensePreviewUrl}
                      alt="사업자등록증"
                      className="w-full max-h-48 object-contain bg-gray-50"
                    />
                  </div>
                )}
              </div>
            ) : (
              <FileUpload
                label=""
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                helperText="사업자등록증 파일을 업로드하세요 (PDF, JPG, PNG)"
                purpose="business_license"
                onUploadComplete={(fId, fName) => {
                  setForm({ ...form, businessLicenseFileId: fId });
                  setLicenseFileName(fName);
                  api.get(`/files/${fId}/download`, { responseType: 'blob' })
                    .then((fileRes) => {
                      const blob = fileRes.data as Blob;
                      if (blob.size > 0) setLicensePreviewUrl(URL.createObjectURL(blob));
                    })
                    .catch(() => {});
                }}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Contact Info Card */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">연락처 정보</h3>
        <div className="space-y-4">
          <Input
            label="연락처"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            placeholder="010-0000-0000"
          />

          {/* Login email - read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              로그인 이메일
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{user?.email || '-'}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">로그인 이메일은 변경할 수 없습니다</p>
          </div>

          {/* Contact email */}
          <Input
            label="대표 이메일"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            placeholder="대표 연락 이메일"
          />

          {/* Emergency email */}
          <Input
            label="비상 연락 이메일"
            type="email"
            value={form.emergencyEmail}
            onChange={(e) => setForm({ ...form, emergencyEmail: e.target.value })}
            placeholder="비상 연락용 이메일 (선택)"
          />

          {/* Address with Daum Postcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              주소
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                readOnly
                placeholder="주소 검색을 클릭하세요"
                value={form.address}
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none cursor-pointer"
                onClick={openAddressSearch}
              />
              <button
                type="button"
                onClick={openAddressSearch}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shrink-0"
              >
                <MapPin className="w-4 h-4" />
                검색
              </button>
            </div>
            <input
              type="text"
              placeholder="상세 주소 입력"
              value={form.addressDetail}
              onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="mb-4">
        <Button onClick={handleSave} loading={saving} className="w-full">
          저장
        </Button>
      </div>

      {/* Password Change Card */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">비밀번호 변경</h3>
        </div>
        <div className="space-y-4">
          <Input
            label="현재 비밀번호"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호를 입력하세요"
          />
          <div>
            <Input
              label="새 비밀번호"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8자 이상 입력하세요"
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-500 mt-1">비밀번호는 8자 이상이어야 합니다</p>
            )}
          </div>
          <div>
            <Input
              label="새 비밀번호 확인"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
            />
            {passwordMismatch && (
              <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !newPasswordConfirm || passwordMismatch}
          >
            {changingPassword ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </div>
      </Card>

      {/* Members */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">멤버</h3>
          <Users className="w-4 h-4 text-gray-400" />
        </div>
        {org.members && org.members.length > 0 ? (
          <div className="space-y-2">
            {org.members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{m.user?.name || m.userId}</p>
                  <p className="text-xs text-gray-400">{m.user?.email}</p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{m.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">멤버 정보 없음</p>
        )}
      </Card>

      {/* License Preview Lightbox */}
      {licensePreviewOpen && licensePreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLicensePreviewOpen(false)}
        >
          <button
            onClick={() => setLicensePreviewOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div
            className="max-w-4xl max-h-[90vh] overflow-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={licensePreviewUrl} alt="사업자등록증" className="w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
