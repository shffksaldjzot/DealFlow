'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import PaymentStageEditor from '@/components/integrated-contract/PaymentStageEditor';
import { useToast } from '@/components/ui/Toast';
import { Plus, Trash2, Home, Save, Power } from 'lucide-react';
import type { IcConfig, IcApartmentType, PaymentStage } from '@/types/integrated-contract';

export default function OrganizerIcConfigPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [config, setConfig] = useState<IcConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Config form
  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([]);
  const [legalTerms, setLegalTerms] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Apartment type form
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);

  const loadConfig = async () => {
    try {
      const data = await api.get(`/ic/configs/event/${eventId}`).then((res) => extractData<IcConfig>(res));
      setConfig(data);
      setPaymentStages(data.paymentStages || []);
      setLegalTerms(data.legalTerms || '');
      setSpecialNotes(data.specialNotes || '');
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [eventId]);

  const handleCreateConfig = async () => {
    setSaving(true);
    try {
      await api.post('/ic/configs', { eventId });
      toast('통합 계약 설정이 생성되었습니다.', 'success');
      await loadConfig();
    } catch {
      toast('설정 생성에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.patch(`/ic/configs/${config.id}`, {
        paymentStages,
        legalTerms,
        specialNotes,
      });
      toast('설정이 저장되었습니다.', 'success');
      await loadConfig();
    } catch {
      toast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!config) return;
    const newStatus = config.status === 'active' ? 'draft' : 'active';
    try {
      await api.patch(`/ic/configs/${config.id}`, { status: newStatus });
      toast(newStatus === 'active' ? '통합 계약이 활성화되었습니다.' : '통합 계약이 비활성화되었습니다.', 'success');
      await loadConfig();
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleAddType = async () => {
    if (!config || !newTypeName.trim()) return;
    setAddingType(true);
    try {
      await api.post(`/ic/configs/${config.id}/apartment-types`, {
        name: newTypeName.trim(),
      });
      setNewTypeName('');
      toast('타입이 추가되었습니다.', 'success');
      await loadConfig();
    } catch {
      toast('타입 추가에 실패했습니다.', 'error');
    } finally {
      setAddingType(false);
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!config) return;
    try {
      await api.delete(`/ic/configs/${config.id}/apartment-types/${typeId}`);
      toast('타입이 삭제되었습니다.', 'success');
      await loadConfig();
    } catch {
      toast('삭제에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Config doesn't exist yet
  if (!config) {
    return (
      <div>
        <PageHeader title="통합 계약 설정" backHref={`/organizer/events/${eventId}`} />
        <Card className="text-center py-8">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-900 mb-2">통합 계약 설정이 없습니다</p>
          <p className="text-sm text-gray-500 mb-4">
            통합 디지털 계약 시스템을 시작하려면 설정을 생성하세요
          </p>
          <Button onClick={handleCreateConfig} loading={saving}>
            통합 계약 설정 생성
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="통합 계약 설정"
        backHref={`/organizer/events/${eventId}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge status={config.status} />
            <Button
              variant={config.status === 'active' ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleStatus}
            >
              <Power className="w-4 h-4 mr-1" />
              {config.status === 'active' ? '비활성화' : '활성화'}
            </Button>
          </div>
        }
      />

      {/* Apartment Types */}
      <Card className="mb-4">
        <h3 className="font-bold text-gray-900 mb-3">아파트 타입 (평면도)</h3>
        <div className="space-y-2 mb-3">
          {(config.apartmentTypes || []).map((type) => (
            <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{type.name}</span>
              </div>
              <button
                onClick={() => handleDeleteType(type.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="타입명 (예: 59A, 84B)"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
          />
          <Button size="sm" onClick={handleAddType} loading={addingType} disabled={!newTypeName.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            추가
          </Button>
        </div>
      </Card>

      {/* Payment Stages */}
      <Card className="mb-4">
        <PaymentStageEditor stages={paymentStages} onChange={setPaymentStages} />
      </Card>

      {/* Legal Terms */}
      <Card className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">약관</label>
        <textarea
          value={legalTerms}
          onChange={(e) => setLegalTerms(e.target.value)}
          placeholder="고객에게 표시될 약관 내용을 입력하세요..."
          rows={5}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </Card>

      {/* Special Notes */}
      <Card className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">특이사항</label>
        <textarea
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          placeholder="계약 시 고객에게 안내할 특이사항..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </Card>

      {/* Save */}
      <Button fullWidth size="lg" onClick={handleSave} loading={saving}>
        <Save className="w-5 h-5 mr-2" />
        설정 저장
      </Button>
    </div>
  );
}
