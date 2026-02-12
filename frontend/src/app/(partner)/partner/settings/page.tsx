'use client';
import { useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { Building2 } from 'lucide-react';
import type { Organization } from '@/types/organization';

export default function PartnerSettingsPage() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    representativeName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
  });

  useEffect(() => {
    api.get('/organizations/me')
      .then((res) => {
        const data = extractData<Organization>(res);
        setOrg(data);
        setForm({
          name: data.name || '',
          representativeName: data.representativeName || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          address: data.address || '',
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
        <PageHeader title="조직 설정" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <div>
        <PageHeader title="조직 설정" />
        <Card>
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">소속된 조직이 없습니다</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="조직 설정" />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">조직 정보</h3>
          <Badge status={org.status} />
        </div>
        <div className="space-y-4">
          <Input label="업체명" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="사업자등록번호" value={org.businessNumber} disabled />
          <Input label="대표자명" value={form.representativeName} onChange={(e) => setForm({ ...form, representativeName: e.target.value })} />
          <Input label="연락처" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          <Input label="이메일" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          <Input label="주소" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} loading={saving}>저장</Button>
        </div>
      </Card>
    </div>
  );
}
