'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CustomerSheetView from '@/components/integrated-contract/CustomerSheetView';
import SelectionSummary from '@/components/integrated-contract/SelectionSummary';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, PenTool, CheckCircle, Home, ChevronRight } from 'lucide-react';
import type { IcContractFlow, IcSelectedItem, IcApartmentType } from '@/types/integrated-contract';

interface SelectedRow {
  sheetId: string;
  rowId: string;
  optionName: string;
  categoryName: string;
  partnerName: string;
}

export default function OptionsPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();

  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<SelectedRow[]>([]);
  const [step, setStep] = useState<'type' | 'select' | 'sign'>('type');
  const [signing, setSigning] = useState(false);
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Apartment type selection
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/events/${code}/options`);
    }
  }, [isAuthenticated, code, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get(`/ic/contract-flow-by-code/${code}`)
      .then((res) => {
        const data = extractData<IcContractFlow>(res);
        setFlow(data);
        // Auto-select and skip type step if only one type
        if (data.apartmentTypes.length === 1) {
          setSelectedTypeId(data.apartmentTypes[0].id);
          setStep('select');
        } else if (data.apartmentTypes.length === 0) {
          setStep('select');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  const handleToggleRow = (
    sheetId: string,
    rowId: string,
    optionName: string,
    categoryName: string,
    partnerName: string,
  ) => {
    setSelectedRows((prev) => {
      const exists = prev.find((s) => s.sheetId === sheetId && s.rowId === rowId);
      if (exists) {
        return prev.filter((s) => !(s.sheetId === sheetId && s.rowId === rowId));
      }
      return [...prev, { sheetId, rowId, optionName, categoryName, partnerName }];
    });
  };

  // Parse price from cellValues
  const parsePrice = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    return Number(String(val).replace(/,/g, '')) || 0;
  };

  // Resolve selected items with price for a specific apartment type column
  const resolveSelectedItems = (typeId: string): IcSelectedItem[] => {
    if (!flow) return [];
    return selectedRows.map((sel) => {
      for (const partner of flow.partners) {
        for (const cat of partner.categories) {
          if (cat.sheetId !== sel.sheetId) continue;
          const opt = cat.options.find((o: any) => o.rowId === sel.rowId);
          if (!opt) continue;

          const col = cat.columns.find((c: any) => c.apartmentTypeId === typeId);
          let columnId = col?.id || '';
          let unitPrice = 0;

          if (col && (col.columnType === 'amount' || !col.columnType)) {
            const cellVal = opt.cellValues?.[columnId];
            unitPrice = cellVal !== undefined
              ? parsePrice(cellVal)
              : parsePrice(opt.prices?.[columnId]);
          }

          if (unitPrice === 0) {
            const amtCols = cat.columns.filter((c: any) => c.columnType === 'amount' || !c.columnType);
            for (const amtCol of amtCols) {
              const p = parsePrice(opt.prices?.[amtCol.id]);
              if (p > 0) { unitPrice = p; columnId = amtCol.id; break; }
              const cv = parsePrice(opt.cellValues?.[amtCol.id]);
              if (cv > 0) { unitPrice = cv; columnId = amtCol.id; break; }
            }
          }

          return {
            sheetId: sel.sheetId,
            rowId: sel.rowId,
            columnId,
            optionName: sel.optionName,
            categoryName: sel.categoryName,
            partnerName: sel.partnerName,
            unitPrice,
          };
        }
      }
      return {
        sheetId: sel.sheetId,
        rowId: sel.rowId,
        columnId: '',
        optionName: sel.optionName,
        categoryName: sel.categoryName,
        partnerName: sel.partnerName,
        unitPrice: 0,
      };
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

  // Phone number formatting
  const formatPhoneNumber = (value: string) => {
    const nums = value.replace(/[^0-9]/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(formatPhoneNumber(e.target.value));
  };

  const handleBack = () => {
    if (step === 'sign') setStep('select');
    else if (step === 'select' && flow && flow.apartmentTypes.length > 1) setStep('type');
    else router.back();
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${code}/options`);
      return;
    }

    if (!flow || selectedRows.length === 0) {
      toast('품목을 선택해주세요.', 'error');
      return;
    }
    if (!selectedTypeId) {
      toast('아파트 타입을 선택해주세요.', 'error');
      return;
    }
    if (!customerName.trim()) {
      toast('이름을 입력해주세요.', 'error');
      return;
    }
    if (!customerPhone.trim()) {
      toast('연락처를 입력해주세요.', 'error');
      return;
    }
    if (!unitNumber.trim()) {
      toast('동호수를 입력해주세요.', 'error');
      return;
    }
    if (!legalAgreed && flow.config.legalTerms?.trim()) {
      toast('약관에 동의해주세요.', 'error');
      return;
    }
    if (!hasSignature) {
      toast('서명을 해주세요.', 'error');
      return;
    }

    setSigning(true);
    try {
      const items = resolveSelectedItems(selectedTypeId);
      const signatureData = canvasRef.current?.toDataURL('image/png') || '';
      const res = await api.post('/ic/contracts', {
        configId: flow.config.id,
        apartmentTypeId: selectedTypeId,
        selectedItems: items.map((item) => ({
          sheetId: item.sheetId,
          rowId: item.rowId,
          columnId: item.columnId,
        })),
        legalAgreed: true,
        signatureData,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        unitNumber: unitNumber || undefined,
        specialNotes: specialNotes || undefined,
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
        <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-800">통합 계약 설정을 찾을 수 없습니다</p>
          <p className="text-sm text-gray-500 mt-1">행사 정보를 확인해주세요.</p>
        </Card>
      </div>
    );
  }

  const resolvedItems = selectedTypeId ? resolveSelectedItems(selectedTypeId) : [];
  const stepLabels = ['타입 선택', '옵션 선택', '서명'];
  const currentStepIndex = step === 'type' ? 0 : step === 'select' ? 1 : 2;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'sign' ? '옵션 선택으로' : step === 'select' ? '뒤로' : '뒤로'}
        </button>

        {/* Step indicator */}
        {flow.apartmentTypes.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${
                  i <= currentStepIndex ? 'text-blue-600 font-semibold' : 'text-gray-400'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < currentStepIndex ? 'bg-blue-600 text-white' :
                    i === currentStepIndex ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {i < currentStepIndex ? '✓' : i + 1}
                  </span>
                  {label}
                </div>
                {i < stepLabels.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Step: Type Selection ─── */}
        {step === 'type' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{flow.config.event?.name || '옵션 계약'}</h1>
              <p className="text-sm text-gray-500 mt-1">계약 타입을 선택해주세요</p>
            </div>

            <div className="space-y-3">
              {flow.apartmentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedTypeId(type.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTypeId === type.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTypeId === type.id
                          ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {selectedTypeId === type.id && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span className={`font-medium ${
                        selectedTypeId === type.id ? 'text-blue-700' : 'text-gray-800'
                      }`}>
                        {type.name}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${
                      selectedTypeId === type.id ? 'text-blue-500' : 'text-gray-300'
                    }`} />
                  </div>
                </button>
              ))}
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={!selectedTypeId}
              onClick={() => setStep('select')}
            >
              다음
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </>
        )}

        {/* ─── Step: Option Selection ─── */}
        {step === 'select' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-800">옵션 선택</h1>
              <p className="text-sm text-gray-500 mt-1">원하시는 품목을 선택해주세요</p>
            </div>

            {/* Card-based product selection */}
            <CustomerSheetView
              partners={flow.partners}
              selectedRows={selectedRows.map((s) => ({ sheetId: s.sheetId, rowId: s.rowId }))}
              onToggleRow={handleToggleRow}
              selectedTypeId={selectedTypeId}
            />

            {/* Bottom buttons (와이어프레임 1-3: 계약 목록보기 / 계약 하기) */}
            <div className="sticky bottom-4 z-10 flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 shadow-lg bg-white"
                onClick={() => router.push('/customer/integrated-contracts')}
              >
                계약 목록보기
                {selectedRows.length > 0 && (
                  <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                    {selectedRows.length}
                  </span>
                )}
              </Button>
              <Button
                size="lg"
                className="flex-1 shadow-lg"
                disabled={selectedRows.length === 0}
                onClick={() => setStep('sign')}
              >
                계약 하기
              </Button>
            </div>
          </>
        )}

        {/* ─── Step: Sign ─── */}
        {step === 'sign' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-800">계약 서명</h1>
              <p className="text-sm text-gray-500 mt-1">내용을 확인하고 서명해주세요</p>
            </div>

            {/* Selected type info */}
            {selectedTypeId && flow.apartmentTypes.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-500 font-medium">선택 타입</p>
                <p className="text-sm font-bold text-blue-700">
                  {flow.apartmentTypes.find((t) => t.id === selectedTypeId)?.name}
                </p>
              </div>
            )}

            {/* Summary */}
            {selectedTypeId && resolvedItems.length > 0 && (
              <Card>
                <SelectionSummary
                  items={resolvedItems}
                  paymentStages={flow.config.paymentStages || []}
                />
              </Card>
            )}

            {/* Customer Info */}
            <Card>
              <h3 className="font-bold text-gray-800 mb-3">계약자 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    이름 <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="이름을 입력해주세요"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    연락처 <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    동호수 <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="예: 101동 1201호"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>

            {/* Legal Terms */}
            {flow.config.legalTerms?.trim() && (
              <Card>
                <h3 className="font-bold text-gray-800 mb-2">약관</h3>
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

            {/* Special Notes */}
            <Card>
              <h3 className="font-bold text-gray-800 mb-2">특이사항</h3>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="특이사항이 있으면 입력해주세요 (선택)"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </Card>

            {/* Signature */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">서명</h3>
                {hasSignature && (
                  <button onClick={clearSignature} className="text-xs text-error hover:text-error">
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

            {/* Submit */}
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              loading={signing}
              disabled={(!legalAgreed && !!flow.config.legalTerms?.trim()) || !selectedTypeId || !hasSignature || !customerName.trim() || !customerPhone.trim() || !unitNumber.trim()}
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
