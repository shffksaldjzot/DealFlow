'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import SheetEditor from '@/components/integrated-contract/SheetEditor';
import { useToast } from '@/components/ui/Toast';
import { Eye, FileSpreadsheet } from 'lucide-react';
import type { IcConfig, IcPartnerSheet } from '@/types/integrated-contract';

export default function PartnerSheetPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [config, setConfig] = useState<IcConfig | null>(null);
  const [sheet, setSheet] = useState<IcPartnerSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const autoCreated = useRef(false);

  const loadData = async () => {
    try {
      const configData = await api.get(`/ic/configs/event/${eventId}`).then((res) => extractData<IcConfig>(res));
      setConfig(configData);
      const sheetsData = await api.get('/ic/sheets/my', { params: { configId: configData.id } }).then((res) => extractData<IcPartnerSheet[]>(res));

      if (sheetsData.length > 0) {
        setSheet(sheetsData[0]);
      } else if (!autoCreated.current) {
        // Auto-create sheet (server sets name automatically)
        autoCreated.current = true;
        try {
          const created = await api.post('/ic/sheets', {
            configId: configData.id,
            categoryName: '품목',
          }).then((res) => extractData<IcPartnerSheet>(res));
          setSheet(created);
        } catch {
          toast('시트 자동 생성에 실패했습니다.', 'error');
        }
      }
    } catch {
      setConfig(null);
      setSheet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleSaveColumns = async (columns: any[]): Promise<any[]> => {
    if (!sheet) return [];
    try {
      const res = await api.put(`/ic/sheets/${sheet.id}/columns`, { columns });
      toast('열이 저장되었습니다.', 'success');
      return res.data?.data || [];
    } catch {
      toast('열 저장에 실패했습니다.', 'error');
      throw new Error();
    }
  };

  const handleSaveRows = async (rows: any[]): Promise<any[]> => {
    if (!sheet) return [];
    try {
      const res = await api.put(`/ic/sheets/${sheet.id}/rows`, { rows });
      toast('행이 저장되었습니다.', 'success');
      return res.data?.data || [];
    } catch {
      toast('행 저장에 실패했습니다.', 'error');
      throw new Error();
    }
  };

  const handleUpdateSheetStatus = async (status: string) => {
    if (!sheet) return;
    try {
      await api.patch(`/ic/sheets/${sheet.id}`, { status });
      toast(status === 'active' ? '시트가 활성화되었습니다.' : '시트 상태가 변경되었습니다.', 'success');
      await loadData();
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
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

  if (!config) {
    return (
      <div>
        <PageHeader title="통합 계약 시트" backHref={`/partner/events/${eventId}`} />
        <Card>
          <EmptyState
            title="통합 계약 설정이 없습니다"
            description="주관사가 통합 계약 설정을 먼저 생성해야 합니다."
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="통합 계약 시트"
        subtitle={sheet ? sheet.categoryName : '품목 시트를 편집하세요'}
        backHref={`/partner/events/${eventId}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/partner/events/${eventId}/sheet/preview`)}
          >
            <Eye className="w-4 h-4 mr-1" />
            미리보기
          </Button>
        }
      />

      {sheet ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-gray-900">{sheet.categoryName}</h3>
              <Badge status={sheet.status} />
            </div>
            <div className="flex items-center gap-2">
              {sheet.status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateSheetStatus('active')}
                >
                  활성화
                </Button>
              )}
              {sheet.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateSheetStatus('inactive')}
                >
                  비활성화
                </Button>
              )}
            </div>
          </div>

          <SheetEditor
            apartmentTypes={config.apartmentTypes || []}
            initialColumns={sheet.columns || []}
            initialRows={sheet.rows || []}
            onSaveColumns={handleSaveColumns}
            onSaveRows={handleSaveRows}
            onError={(msg) => toast(msg, 'error')}
          />
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="시트를 불러오는 중..."
            description="잠시만 기다려 주세요"
            icon={<FileSpreadsheet className="w-12 h-12 text-gray-300" />}
          />
        </Card>
      )}
    </div>
  );
}
