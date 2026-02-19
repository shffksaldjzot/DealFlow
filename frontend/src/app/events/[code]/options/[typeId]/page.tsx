'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import OptionsList from '@/components/integrated-contract/OptionsList';
import SelectionSummary from '@/components/integrated-contract/SelectionSummary';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, PenTool, CheckCircle } from 'lucide-react';
import type { IcContractFlow, IcSelectedItem } from '@/types/integrated-contract';

export default function OptionsSelectPage() {
  const { code, typeId } = useParams<{ code: string; typeId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();

  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<IcSelectedItem[]>([]);
  const [step, setStep] = useState<'select' | 'sign'>('select');
  const [signing, setSigning] = useState(false);
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    api.get(`/ic/contract-flow-by-code/${code}/type/${typeId}`)
      .then((res) => setFlow(extractData<IcContractFlow>(res)))
      .catch(() => toast('데이터를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [code, typeId, toast]);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  const handleToggle = (
    sheetId: string,
    rowId: string,
    columnId: string,
    unitPrice: number,
    optionName: string,
    categoryName: string,
    partnerName: string,
  ) => {
    setSelectedItems((prev) => {
      const exists = prev.find((s) => s.sheetId === sheetId && s.rowId === rowId);
      if (exists) {
        return prev.filter((s) => !(s.sheetId === sheetId && s.rowId === rowId));
      }
      return [...prev, { sheetId, rowId, columnId, optionName, categoryName, partnerName, unitPrice }];
    });
  };

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${code}/options/${typeId}`);
      return;
    }

    if (!flow || selectedItems.length === 0) {
      toast('품목을 선택해주세요.', 'error');
      return;
    }
    if (!legalAgreed) {
      toast('약관에 동의해주세요.', 'error');
      return;
    }
    if (!hasSignature) {
      toast('서명을 해주세요.', 'error');
      return;
    }

    setSigning(true);
    try {
      const signatureData = canvasRef.current?.toDataURL('image/png') || '';
      const res = await api.post('/ic/contracts', {
        configId: flow.config.id,
        apartmentTypeId: typeId,
        selectedItems: selectedItems.map((item) => ({
          sheetId: item.sheetId,
          rowId: item.rowId,
          columnId: item.columnId,
        })),
        legalAgreed: true,
        signatureData,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      });
      const contract = extractData<{ id: string; shortCode: string }>(res);
      toast('계약이 완료되었습니다!', 'success');
      router.push(`/customer/integrated-contracts/${contract.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast(Array.isArray(msg) ? msg[0] : msg || '계약 생성에 실패했습니다.', 'error');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!flow) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Back */}
        <button
          onClick={() => step === 'sign' ? setStep('select') : router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'sign' ? '옵션 선택으로' : '타입 선택으로'}
        </button>

        {step === 'select' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">옵션 선택</h1>
              <p className="text-sm text-gray-500 mt-1">원하시는 품목을 선택해주세요</p>
            </div>

            {/* Options */}
            <OptionsList
              partners={flow.partners}
              selectedOptions={selectedItems.map((s) => ({
                sheetId: s.sheetId,
                rowId: s.rowId,
                columnId: s.columnId,
              }))}
              onToggle={handleToggle}
            />

            {/* Summary */}
            {selectedItems.length > 0 && (
              <Card>
                <SelectionSummary
                  items={selectedItems}
                  paymentStages={flow.config.paymentStages || []}
                />
              </Card>
            )}

            {/* Next */}
            <Button
              fullWidth
              size="lg"
              disabled={selectedItems.length === 0}
              onClick={() => setStep('sign')}
            >
              <PenTool className="w-5 h-5 mr-2" />
              서명하기 ({selectedItems.length}개 선택)
            </Button>
          </>
        )}

        {step === 'sign' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">계약 서명</h1>
              <p className="text-sm text-gray-500 mt-1">내용을 확인하고 서명해주세요</p>
            </div>

            {/* Summary */}
            <Card>
              <SelectionSummary
                items={selectedItems}
                paymentStages={flow.config.paymentStages || []}
              />
            </Card>

            {/* Customer Info */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-3">계약자 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>

            {/* Legal Terms */}
            {flow.config.legalTerms && (
              <Card>
                <h3 className="font-bold text-gray-900 mb-2">약관</h3>
                <div className="max-h-32 overflow-y-auto text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3 whitespace-pre-wrap">
                  {flow.config.legalTerms}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={legalAgreed}
                    onChange={(e) => setLegalAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">약관에 동의합니다</span>
                </label>
              </Card>
            )}

            {/* Signature */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">서명</h3>
                {hasSignature && (
                  <button onClick={clearSignature} className="text-xs text-red-500 hover:text-red-700">
                    지우기
                  </button>
                )}
              </div>
              <canvas
                ref={canvasRef}
                width={350}
                height={150}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasSignature && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  위 영역에 서명해주세요
                </p>
              )}
            </Card>

            {/* Special Notes */}
            {flow.config.specialNotes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-700 whitespace-pre-wrap">{flow.config.specialNotes}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              loading={signing}
              disabled={!legalAgreed && !!flow.config.legalTerms}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              계약 완료
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
