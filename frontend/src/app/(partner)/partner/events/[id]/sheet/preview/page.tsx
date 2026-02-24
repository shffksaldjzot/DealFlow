'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { FileSpreadsheet } from 'lucide-react';
import type { IcConfig, IcPartnerSheet } from '@/types/integrated-contract';

export default function PartnerSheetPreviewPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [config, setConfig] = useState<IcConfig | null>(null);
  const [sheets, setSheets] = useState<IcPartnerSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const configData = await api.get(`/ic/configs/event/${eventId}`).then((res) => extractData<IcConfig>(res));
        setConfig(configData);
        const sheetsData = await api.get('/ic/sheets/my', { params: { configId: configData.id } }).then((res) => extractData<IcPartnerSheet[]>(res));
        setSheets(sheetsData);
      } catch {
        toast('데이터를 불러올 수 없습니다.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!config || sheets.length === 0) {
    return (
      <div>
        <PageHeader title="시트 미리보기" backHref={`/partner/events/${eventId}/sheet`} />
        <Card>
          <EmptyState title="시트가 없습니다" description="시트를 먼저 생성해주세요." />
        </Card>
      </div>
    );
  }

  const apartmentTypes = config.apartmentTypes || [];

  return (
    <div>
      <PageHeader
        title="시트 미리보기"
        subtitle="고객에게 표시될 형태로 미리봅니다"
        backHref={`/partner/events/${eventId}/sheet`}
      />

      {sheets.map((sheet) => (
        <Card key={sheet.id} className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-800">{sheet.categoryName}</h3>
            <Badge status={sheet.status} />
          </div>

          {sheet.rows.length === 0 ? (
            <p className="text-sm text-gray-400">옵션이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">옵션</th>
                    {(sheet.columns || [])
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((col) => (
                        <th key={col.id} className="px-4 py-2.5 text-right font-medium text-gray-600">
                          {col.customName || col.apartmentType?.name || '미지정'}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((row) => (
                      <tr key={row.id} className="border-b border-gray-200">
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {row.optionName}
                          {row.popupContent && (
                            <span className="ml-1 text-blue-400 cursor-help" title={row.popupContent}>
                              ⓘ
                            </span>
                          )}
                        </td>
                        {(sheet.columns || [])
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((col) => {
                            const isText = col.columnType === 'text';
                            const cellVal = row.cellValues?.[col.id];
                            const priceVal = row.prices?.[col.id];

                            if (isText) {
                              const textVal = cellVal !== undefined ? String(cellVal) : '';
                              return (
                                <td key={col.id} className="px-4 py-2.5 text-center text-gray-700">
                                  {textVal || '-'}
                                </td>
                              );
                            }

                            // amount column: prefer cellValues, fallback to prices
                            const numVal = cellVal !== undefined
                              ? Number(cellVal)
                              : (priceVal ?? 0);
                            return (
                              <td key={col.id} className="px-4 py-2.5 text-right text-gray-700">
                                {numVal ? `${Number(numVal).toLocaleString('ko-KR')}원` : '-'}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {sheet.memo && (
            <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              {sheet.memo}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
