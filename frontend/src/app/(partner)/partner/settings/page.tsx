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
import { Building2, FileCheck, ZoomIn, X, Download, Lock } from 'lucide-react';
import type { Organization } from '@/types/organization';

export default function PartnerSettingsPage() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contactPhone: '',
    contactEmail: '',
    address: '',
    items: '',
    businessLicenseFileId: '',
  });
  const [licenseFileName, setLicenseFileName] = useState('');
  const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
  const [licensePreviewOpen, setLicensePreviewOpen] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const passwordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;

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

  useEffect(() => {
    api.get('/organizations/me')
      .then((res) => {
        const data = extractData<Organization>(res);
        setOrg(data);
        setForm({
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          address: data.address || '',
          items: data.items || '',
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
    setSaving(true);
    try {
      // Strip empty strings to avoid backend validation failures
      // (@IsUUID, @IsEmail, @Length validators reject empty strings even with @IsOptional)
      const payload: Record<string, any> = {};
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.contactEmail) payload.contactEmail = form.contactEmail;
      if (form.address) payload.address = form.address;
      if (form.items !== undefined) payload.items = form.items || undefined;
      if (form.businessLicenseFileId) payload.businessLicenseFileId = form.businessLicenseFileId;
      await api.patch(`/organizations/${org.id}`, payload);
      toast('저장되었습니다.', 'success');
      // Re-fetch to confirm changes persisted
      const res = await api.get('/organizations/me');
      const data = extractData<Organization>(res);
      setOrg(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const errorMessage = Array.isArray(msg) ? msg[0] : (msg || '저장에 실패했습니다.');
      toast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="업체 정보 관리" backHref="/partner" />
        <div className="h-64 bg-white rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <div>
        <PageHeader title="업체 정보 관리" backHref="/partner" />
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
      <PageHeader title="업체 정보 관리" subtitle="사업자 정보와 연락처를 관리할 수 있습니다" backHref="/partner" />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">기본 정보</h3>
          <Badge status={org.status} />
        </div>
        <div className="space-y-4">
          <div>
            <Input label="업체명" value={org.name} disabled />
            <p className="text-xs text-gray-400 mt-1">변경이 필요하시면 운영사(DealFlow)로 연락해주세요</p>
          </div>
          <Input label="사업자등록번호" value={org.businessNumber} disabled />
          <div>
            <Input label="대표자명" value={org.representativeName || ''} disabled />
            <p className="text-xs text-gray-400 mt-1">변경이 필요하시면 운영사(DealFlow)로 연락해주세요</p>
          </div>
          <Input label="연락처" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          <Input label="이메일" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          <Input label="주소" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          {/* 기본 품목 */}
          <div>
            <Input
              label="기본 취급 품목"
              value={form.items}
              onChange={(e) => setForm({ ...form, items: e.target.value })}
              placeholder="예: 줄눈, 탄성코트, 가구, 가전, 도어락"
            />
            <p className="text-xs text-gray-400 mt-1">쉼표(,)로 구분하여 입력하세요. 행사 참가 시 기본 품목으로 자동 설정됩니다.</p>
          </div>

          {/* Business License Upload + Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              사업자등록증
            </label>
            {form.businessLicenseFileId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-success-light rounded-xl">
                  <FileCheck className="w-5 h-5 text-success" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success">
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
                      className="text-xs text-error hover:text-error"
                    >
                      삭제
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
                  // Load preview for newly uploaded file
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
        <div className="mt-6">
          <Button onClick={handleSave} loading={saving}>저장</Button>
        </div>
      </Card>

      {/* Password Change */}
      <Card className="mt-4">
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
              <p className="text-xs text-error mt-1">비밀번호는 8자 이상이어야 합니다</p>
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
              <p className="text-xs text-error mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !newPasswordConfirm || passwordMismatch}
          >
            {changingPassword ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </div>
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
