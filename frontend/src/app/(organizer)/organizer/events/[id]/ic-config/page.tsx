'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import PaymentStageEditor from '@/components/integrated-contract/PaymentStageEditor';
import SheetEditor from '@/components/integrated-contract/SheetEditor';
import { useToast } from '@/components/ui/Toast';
import { QRCodeSVG } from 'qrcode.react';
import { Save, Power, Copy, QrCode, Home } from 'lucide-react';
import type { IcConfig, IcPartnerSheet, IcApartmentType, PaymentStage } from '@/types/integrated-contract';
import type { Event } from '@/types/event';

export default function OrganizerIcConfigPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [config, setConfig] = useState<IcConfig | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Config form
  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([]);
  const [legalTerms, setLegalTerms] = useState('');

  // Partner sheets
  const [sheets, setSheets] = useState<IcPartnerSheet[]>([]);
  const [activeSheetTab, setActiveSheetTab] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      const data = await api.get(`/ic/configs/event/${eventId}`).then((res) => extractData<IcConfig>(res));
      setConfig(data);
      setPaymentStages(data.paymentStages || []);
      setLegalTerms(data.legalTerms || '');
    } catch {
      setConfig(null);
    }
  };

  const loadEvent = async () => {
    try {
      const data = await api.get(`/events/${eventId}`).then((res) => extractData<Event>(res));
      setEvent(data);
    } catch {}
  };

  const loadSheets = async (configId: string) => {
    try {
      const data = await api.get(`/ic/configs/${configId}/sheets`).then((res) => extractData<IcPartnerSheet[]>(res));
      setSheets(data);
      if (data.length > 0 && !activeSheetTab) {
        setActiveSheetTab(data[0].id);
      }
    } catch {}
  };

  useEffect(() => {
    Promise.all([loadConfig(), loadEvent()]).finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (config?.id) {
      loadSheets(config.id);
    }
  }, [config?.id]);

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
      await api.patch(`/ic/configs/${config.id}`, { paymentStages, legalTerms });
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('복사되었습니다.', 'success');
  };

  // Group sheets by partner
  const partnerGroups = sheets.reduce((acc, sheet) => {
    const key = sheet.partnerId;
    if (!acc[key]) acc[key] = { name: sheet.partner?.name || '알 수 없음', sheets: [] };
    acc[key].sheets.push(sheet);
    return acc;
  }, {} as Record<string, { name: string; sheets: IcPartnerSheet[] }>);

  // Collect apartment types from all sheet columns
  const collectedTypes = new Set<string>();
  sheets.forEach((s) => s.columns?.forEach((c) => {
    if (c.apartmentType?.name) collectedTypes.add(c.apartmentType.name);
    else if (c.customName) collectedTypes.add(c.customName);
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

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

  const inviteCode = event?.inviteCode || '';
  const publicUrl = inviteCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${inviteCode}/options` : '';

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

      {/* QR Code & Invite Code */}
      {inviteCode && (
        <Card className="mb-4">
          <h3 className="font-bold text-gray-900 mb-4">고객 접속 정보</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <QRCodeSVG value={publicUrl} size={140} />
            </div>

            <div className="flex-1 space-y-4 text-center sm:text-left">
              {/* Invite Code */}
              <div>
                <p className="text-xs text-gray-500 mb-1">초대코드</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-gray-900">
                  {inviteCode}
                </p>
              </div>

              {/* URL */}
              <div>
                <p className="text-xs text-gray-500 mb-1">접속 URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg truncate flex-1">
                    {publicUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(publicUrl)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Collected Apartment Types (read-only) */}
      {collectedTypes.size > 0 && (
        <Card className="mb-4">
          <h3 className="font-bold text-gray-900 mb-2">등록된 타입</h3>
          <p className="text-xs text-gray-500 mb-2">파트너 시트에서 자동 수집된 타입입니다</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(collectedTypes).map((name) => (
              <span key={name} className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                {name}
              </span>
            ))}
          </div>
        </Card>
      )}

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

      {/* Save Config */}
      <Button fullWidth size="lg" onClick={handleSave} loading={saving} className="mb-6">
        <Save className="w-5 h-5 mr-2" />
        설정 저장
      </Button>

      {/* Partner Sheets */}
      {Object.keys(partnerGroups).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">파트너별 시트 관리</h2>
          {Object.entries(partnerGroups).map(([partnerId, group]) => (
            <Card key={partnerId} className="mb-4">
              <h3 className="font-bold text-gray-900 mb-3">{group.name}</h3>

              {/* Sheet tabs */}
              {group.sheets.length > 1 && (
                <div className="flex gap-1 mb-3 overflow-x-auto">
                  {group.sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => setActiveSheetTab(sheet.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        activeSheetTab === sheet.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sheet.categoryName}
                    </button>
                  ))}
                </div>
              )}

              {/* Active sheet editor */}
              {group.sheets.map((sheet) => {
                const isVisible = group.sheets.length === 1 || activeSheetTab === sheet.id;
                if (!isVisible) return null;
                return (
                  <div key={sheet.id}>
                    {group.sheets.length === 1 && (
                      <p className="text-sm text-gray-500 mb-2">{sheet.categoryName}</p>
                    )}
                    <SheetEditor
                      apartmentTypes={config.apartmentTypes || []}
                      initialColumns={sheet.columns}
                      initialRows={sheet.rows}
                      onSaveColumns={async (cols) => {
                        await api.put(`/ic/configs/${config.id}/sheets/${sheet.id}/columns`, {
                          columns: cols,
                        });
                        toast('열이 저장되었습니다.', 'success');
                        await loadSheets(config.id);
                      }}
                      onSaveRows={async (rowsData) => {
                        await api.put(`/ic/configs/${config.id}/sheets/${sheet.id}/rows`, {
                          rows: rowsData,
                        });
                        toast('행이 저장되었습니다.', 'success');
                        await loadSheets(config.id);
                      }}
                    />
                  </div>
                );
              })}
            </Card>
          ))}
        </div>
      )}

      {Object.keys(partnerGroups).length === 0 && (
        <Card className="text-center py-6 mt-6">
          <p className="text-gray-500 text-sm">아직 등록된 파트너 시트가 없습니다.</p>
          <p className="text-gray-400 text-xs mt-1">파트너가 행사에 참여하면 시트가 표시됩니다.</p>
        </Card>
      )}
    </div>
  );
}
