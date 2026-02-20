'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import SheetEditor from '@/components/integrated-contract/SheetEditor';
import { useToast } from '@/components/ui/Toast';
import { Plus, Eye, FileSpreadsheet, Trash2 } from 'lucide-react';
import type { IcConfig, IcPartnerSheet } from '@/types/integrated-contract';

export default function PartnerSheetPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [config, setConfig] = useState<IcConfig | null>(null);
  const [sheets, setSheets] = useState<IcPartnerSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async () => {
    try {
      const configData = await api.get(`/ic/configs/event/${eventId}`).then((res) => extractData<IcConfig>(res));
      setConfig(configData);
      const sheetsData = await api.get('/ic/sheets/my', { params: { configId: configData.id } }).then((res) => extractData<IcPartnerSheet[]>(res));
      setSheets(sheetsData);
      if (sheetsData.length > 0 && !activeSheetId) {
        setActiveSheetId(sheetsData[0].id);
      }
    } catch {
      // Config might not exist yet
      setConfig(null);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleCreateSheet = async () => {
    if (!config || !newCategoryName.trim()) return;
    setCreating(true);
    try {
      const created = await api.post('/ic/sheets', {
        configId: config.id,
        categoryName: newCategoryName.trim(),
      }).then((res) => extractData<IcPartnerSheet>(res));
      setSheets([...sheets, created]);
      setActiveSheetId(created.id);
      setNewCategoryName('');
      toast('시트가 생성되었습니다.', 'success');
    } catch {
      toast('시트 생성에 실패했습니다.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveColumns = async (columns: any[]): Promise<any[]> => {
    if (!activeSheetId) return [];
    try {
      const res = await api.put(`/ic/sheets/${activeSheetId}/columns`, { columns });
      toast('열이 저장되었습니다.', 'success');
      return res.data?.data || [];
    } catch {
      toast('열 저장에 실패했습니다.', 'error');
      throw new Error();
    }
  };

  const handleSaveRows = async (rows: any[]) => {
    if (!activeSheetId) return;
    try {
      await api.put(`/ic/sheets/${activeSheetId}/rows`, { rows });
      toast('행이 저장되었습니다.', 'success');
      await loadData();
    } catch {
      toast('행 저장에 실패했습니다.', 'error');
      throw new Error();
    }
  };

  const handleUpdateSheetStatus = async (sheetId: string, status: string) => {
    try {
      await api.patch(`/ic/sheets/${sheetId}`, { status });
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

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  return (
    <div>
      <PageHeader
        title="통합 계약 시트"
        subtitle={`품목 시트를 편집하세요`}
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

      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {sheets.map((sheet) => (
          <button
            key={sheet.id}
            onClick={() => setActiveSheetId(sheet.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeSheetId === sheet.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {sheet.categoryName}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeSheetId === sheet.id ? 'bg-blue-500' : 'bg-gray-100'
            }`}>
              {sheet.rows?.length || 0}
            </span>
          </button>
        ))}

        {/* New Sheet Input */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="새 시트명..."
            className="px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm w-32 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSheet()}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateSheet}
            loading={creating}
            disabled={!newCategoryName.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active Sheet Editor */}
      {activeSheet ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-gray-900">{activeSheet.categoryName}</h3>
              <Badge status={activeSheet.status} />
            </div>
            <div className="flex items-center gap-2">
              {activeSheet.status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateSheetStatus(activeSheet.id, 'active')}
                >
                  활성화
                </Button>
              )}
              {activeSheet.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateSheetStatus(activeSheet.id, 'inactive')}
                >
                  비활성화
                </Button>
              )}
            </div>
          </div>

          <SheetEditor
            apartmentTypes={config.apartmentTypes || []}
            initialColumns={activeSheet.columns || []}
            initialRows={activeSheet.rows || []}
            onSaveColumns={handleSaveColumns}
            onSaveRows={handleSaveRows}
          />
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="시트를 생성하세요"
            description="카테고리명을 입력하고 시트를 추가하세요"
            icon={<FileSpreadsheet className="w-12 h-12 text-gray-300" />}
          />
        </Card>
      )}
    </div>
  );
}
