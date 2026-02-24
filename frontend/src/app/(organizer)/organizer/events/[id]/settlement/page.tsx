'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Calendar, MapPin, BarChart3, Pencil, Save } from 'lucide-react';
import type { Event } from '@/types/event';

interface SettlementProduct {
  rowId: string;
  optionName: string;
  categoryName: string;
  partnerName: string;
  partnerId: string;
  contractCount: number;
  totalRevenue: number;
  commissionRate: number;
}

interface SettlementData {
  products: SettlementProduct[];
  totals: {
    totalContracts: number;
    totalRevenue: number;
    totalCommission: number;
  };
}

export default function SettlementPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [detailProduct, setDetailProduct] = useState<SettlementProduct | null>(null);
  const [editingCommission, setEditingCommission] = useState<number>(0);
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/events/${eventId}`).then((res) => setEvent(extractData<Event>(res))).catch(() => {}),
      api.get(`/ic/settlement/${eventId}`).then((res) => setData(extractData<SettlementData>(res))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [eventId]);

  const openDetail = (product: SettlementProduct) => {
    setDetailProduct(product);
    setEditingCommission(product.commissionRate);
  };

  const saveCommission = async () => {
    // Note: commission is saved per-sheet, not per-product. This is a simplified version.
    toast('수수료율은 통합 계약 설정에서 시트별로 변경할 수 있습니다.', 'info');
    setDetailProduct(null);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="정산 / 품목 관리" backHref={`/organizer/events/${eventId}`} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="정산 / 품목 관리"
        backHref={`/organizer/events/${eventId}`}
      />

      {/* 행사 개요 (파란 박스) */}
      {event && (
        <div className="bg-blue-100 rounded-xl p-4 mb-6">
          <h2 className="text-base font-bold text-blue-900 mb-2">{event.name}</h2>
          <div className="flex items-center gap-4 text-xs text-blue-700">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(event.startDate)} ~ {formatDate(event.endDate)}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.venue}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 정산 요약 카드 */}
      {data && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-3">
            <p className="text-xs text-gray-500">총 계약</p>
            <p className="text-lg font-bold text-gray-800">{data.totals.totalContracts}건</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-xs text-gray-500">총 매출</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(data.totals.totalRevenue)}</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-xs text-gray-500">총 수수료</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(data.totals.totalCommission)}</p>
          </Card>
        </div>
      )}

      {/* 상세 품목 테이블 (와이어프레임 4-3) */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-800">상세 품목</h3>
        </div>

        {/* Table header */}
        <div className="border-b-2 border-gray-800 pb-2 mb-1">
          <div className="grid grid-cols-[1fr_72px_56px_72px] gap-2 text-xs font-bold text-gray-700">
            <span>상세 품목</span>
            <span>업체명</span>
            <span className="text-center">계약건</span>
            <span className="text-right">상세</span>
          </div>
        </div>

        {/* Table rows */}
        {(!data || data.products.length === 0) ? (
          <div className="text-center py-8 text-sm text-gray-400">
            등록된 품목이 없습니다.
          </div>
        ) : (
          data.products.map((product) => (
            <div
              key={product.rowId}
              className="grid grid-cols-[1fr_72px_56px_72px] gap-2 items-center py-2.5 border-b border-gray-100 text-sm"
            >
              <div className="min-w-0">
                <p className="text-gray-800 truncate font-medium">{product.optionName}</p>
                <p className="text-xs text-gray-400 truncate">{product.categoryName}</p>
              </div>
              <span className="text-gray-600 text-xs truncate">{product.partnerName || '—'}</span>
              <span className="text-gray-800 text-sm text-center font-semibold">{product.contractCount}</span>
              <button
                onClick={() => openDetail(product)}
                className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg font-medium text-right transition-colors"
              >
                상세보기
              </button>
            </div>
          ))
        )}
      </Card>

      {/* 정산 상세 모달 (와이어프레임 4-4) */}
      <Modal
        isOpen={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        title="정산 상세"
      >
        {detailProduct && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">품목명</span>
                <span className="font-medium text-gray-800">{detailProduct.optionName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">업체명</span>
                <span className="font-medium text-gray-800">{detailProduct.partnerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">카테고리</span>
                <span className="font-medium text-gray-800">{detailProduct.categoryName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">계약건수</span>
                <span className="font-bold text-gray-800">{detailProduct.contractCount}건</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">계약금 총액</span>
                <span className="font-bold text-blue-600">{formatCurrency(detailProduct.totalRevenue)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">수수료율</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-800">{detailProduct.commissionRate}%</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">주관사 수익</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(Math.round(detailProduct.totalRevenue * detailProduct.commissionRate / 100))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">업체 수익</span>
                <span className="font-bold text-gray-800">
                  {formatCurrency(detailProduct.totalRevenue - Math.round(detailProduct.totalRevenue * detailProduct.commissionRate / 100))}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" fullWidth onClick={() => setDetailProduct(null)}>
                닫기
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
