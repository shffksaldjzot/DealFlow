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
import { Building2, FileCheck } from 'lucide-react';
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
    businessLicenseFileId: '',
  });
  const [licenseFileName, setLicenseFileName] = useState('');

  useEffect(() => {
    api.get('/organizations/me')
      .then((res) => {
        const data = extractData<Organization>(res);
        setOrg(data);
        setForm({
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          address: data.address || '',
          businessLicenseFileId: data.businessLicenseFileId || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await api.patch(`/organizations/${org.id}`, form);
      toast('저장되었습니다.', 'success');
    } catch {
      toast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="업체 정보 관리" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <div>
        <PageHeader title="업체 정보 관리" />
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
      <PageHeader title="업체 정보 관리" subtitle="사업자 정보와 연락처를 관리할 수 있습니다" />

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

          {/* Business License Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              사업자등록증
            </label>
            {form.businessLicenseFileId ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <FileCheck className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    {licenseFileName || '사업자등록증 업로드 완료'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setForm({ ...form, businessLicenseFileId: '' }); setLicenseFileName(''); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            ) : (
              <FileUpload
                label=""
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                helperText="사업자등록증 파일을 업로드하세요 (PDF, JPG, PNG)"
                purpose="business_license"
                onUploadComplete={(fId, fName, file) => {
                  setForm({ ...form, businessLicenseFileId: fId });
                  setLicenseFileName(fName);
                }}
              />
            )}
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} loading={saving}>저장</Button>
        </div>
      </Card>
    </div>
  );
}
