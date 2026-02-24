'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PeriodSelector, { PeriodValue } from '@/components/ui/PeriodSelector';
import { FileText, ChevronRight, Clock, CheckCircle, AlertCircle, Ticket, Search, ChevronDown, Camera, X, XCircle, Layers } from 'lucide-react';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';
import { useToast } from '@/components/ui/Toast';
import type { EventVisit } from '@/types/event';
import type { IcContract } from '@/types/integrated-contract';

function filterByPeriod<T extends { createdAt?: string }>(items: T[], period: PeriodValue): T[] {
  if (!period.from && !period.to) return items;
  return items.filter((item) => {
    const d = item.createdAt ? new Date(item.createdAt) : null;
    if (!d) return true;
    if (period.from && d < new Date(period.from)) return false;
    if (period.to) { const to = new Date(period.to); to.setHours(23, 59, 59, 999); if (d > to) return false; }
    return true;
  });
}

export default function CustomerHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [icContracts, setIcContracts] = useState<IcContract[]>([]);
  const [visits, setVisits] = useState<EventVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractCode, setContractCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<any>(null);
  const [period, setPeriod] = useState<PeriodValue>({ from: null, to: null, label: '전체' });

  const fetchContracts = () => {
    api.get('/customer/contracts').then((res) => setContracts(extractData(res))).catch(() => {});
    api.get('/ic/contracts/my').then((res) => setIcContracts(extractData(res))).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api.get('/customer/contracts').then((res) => setContracts(extractData(res))).catch(() => {}),
      api.get('/ic/contracts/my').then((res) => setIcContracts(extractData(res))).catch(() => {}),
      api.get('/event-visits/my').then((res) => setVisits(extractData(res))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCancelContract = async (contractId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 계약을 취소하시겠습니까?')) return;
    try {
      await api.post(`/customer/contracts/${contractId}/cancel`);
      toast('계약이 취소되었습니다.', 'success');
      fetchContracts();
    } catch {
      toast('취소에 실패했습니다.', 'error');
    }
  };

  const filteredContracts = useMemo(() => filterByPeriod(contracts as any[], period) as Contract[], [contracts, period]);
  const filteredIcContracts = useMemo(() => filterByPeriod(icContracts as any[], period) as IcContract[], [icContracts, period]);
  const filteredVisits = useMemo(() => filterByPeriod(visits as any[], period) as EventVisit[], [visits, period]);

  const pendingContracts = filteredContracts.filter(
    (c) => c.status === 'pending' || c.status === 'in_progress',
  );
  const signedContracts = filteredContracts.filter(
    (c) => c.status === 'signed' || c.status === 'completed',
  );
  const signedIcContracts = filteredIcContracts.filter(
    (c) => c.status === 'signed' || c.status === 'completed',
  );
  const activeVisits = filteredVisits.filter((v) => v.status === 'reserved');

  const handleContractCodeSubmit = () => {
    const trimmed = contractCode.trim().replace(/\s/g, '');
    if (trimmed) {
      router.push(`/contract/${trimmed}`);
    }
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setShowScanner(false);
  }, []);

  const handleQrScan = async () => {
    setShowScanner(true);

    // Dynamically import to avoid SSR issues
    const { Html5Qrcode } = await import('html5-qrcode');

    // Wait for DOM element to render
    setTimeout(async () => {
      const el = document.getElementById('qr-reader');
      if (!el) return;

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            // Extract contract code from URL or use as-is
            let code = decodedText;
            const match = decodedText.match(/\/contract\/([^/?\s]+)/);
            if (match) {
              code = match[1];
            }
            // Also handle /events/ URLs for visit QR
            const eventMatch = decodedText.match(/\/events\/([^/?\s]+)\/(visit|join)/);
            if (eventMatch) {
              scanner.stop().catch(() => {});
              scannerRef.current = null;
              setShowScanner(false);
              router.push(`/events/${eventMatch[1]}/${eventMatch[2]}`);
              return;
            }
            scanner.stop().catch(() => {});
            scannerRef.current = null;
            setShowScanner(false);
            router.push(`/contract/${code}`);
          },
          () => {}, // ignore scan failures
        );
      } catch {
        setShowScanner(false);
        // Fallback: try to open camera app via URL scheme
        alert('카메라를 사용할 수 없습니다.\n카메라 권한을 확인하거나 아래 코드 입력란을 이용해주세요.');
        setShowCodeInput(true);
      }
    }, 100);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div>
      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative h-full flex flex-col">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-white font-bold text-lg">QR 코드 스캔</h3>
              <button
                onClick={stopScanner}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="w-full max-w-sm">
                <div id="qr-reader" className="rounded-xl overflow-hidden" />
                <p className="text-white/70 text-sm text-center mt-4">
                  계약서 QR 코드 또는 방문예약 QR 코드를 스캔하세요
                </p>
              </div>
            </div>
            <div className="p-4 pb-8">
              <button
                onClick={() => { stopScanner(); setShowCodeInput(true); }}
                className="w-full py-3 text-white/80 text-sm font-medium text-center"
              >
                코드 직접 입력하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          안녕하세요, {user?.name || '고객'}님
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          계약 현황을 확인하세요
        </p>
      </div>

      {/* QR Scan Button - prominent */}
      <button
        onClick={handleQrScan}
        className="w-full mb-4 flex items-center justify-center gap-3 py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors shadow-sm"
      >
        <Camera className="w-5 h-5" />
        <span className="text-base font-bold">QR 코드 스캔</span>
      </button>

      {/* Collapsible Contract Code Input */}
      <div className="mb-6">
        {!showCodeInput ? (
          <button
            onClick={() => setShowCodeInput(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>계약 코드 직접 입력</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Card>
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-2">계약 코드 입력</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleContractCodeSubmit()}
                    placeholder="8자리 코드 입력"
                    maxLength={16}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-widest"
                    autoFocus
                  />
                  <Button onClick={handleContractCodeSubmit} disabled={!contractCode.trim()}>
                    확인
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Period Filter */}
      <div className="mb-4">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Pending Signing Alert */}
      {!loading && pendingContracts.length > 0 && (
        <div className="mb-6 flex items-start gap-3 px-4 py-4 bg-warning-light border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              서명 대기 중인 계약 {pendingContracts.length}건
            </p>
            <p className="text-[13px] text-amber-700 mt-0.5">
              아래 계약서를 확인하고 서명해주세요
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-[13px] font-medium text-gray-500 mb-1">개별계약</p>
          <p className="text-2xl font-extrabold text-gray-800 tracking-tight">{loading ? '-' : filteredContracts.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-[13px] font-medium text-gray-500 mb-1">통합계약</p>
          <p className="text-2xl font-extrabold text-blue-600 tracking-tight">{loading ? '-' : filteredIcContracts.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-[13px] font-medium text-gray-500 mb-1">대기중</p>
          <p className="text-2xl font-extrabold text-warning tracking-tight">{loading ? '-' : pendingContracts.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-[13px] font-medium text-gray-500 mb-1">완료</p>
          <p className="text-2xl font-extrabold text-success tracking-tight">{loading ? '-' : signedContracts.length + signedIcContracts.length}</p>
        </div>
      </div>

      {/* Pending Contracts - highlighted */}
      {!loading && pendingContracts.length > 0 && (
        <>
          <h3 className="text-base font-semibold text-gray-800 mb-3">서명 대기 계약</h3>
          <div className="space-y-2.5 mb-6">
            {pendingContracts.map((c) => (
              <Card key={c.id} hoverable onClick={() => router.push(`/customer/contracts/${c.id}`)} className="border-l-[3px] border-l-warning">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{c.event?.name || '계약서'}</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {c.partner?.name}
                      {(c.partner as any)?.items && (
                        <span className="text-gray-400 ml-1">· {(c.partner as any).items.split(',').map((s: string) => s.trim()).join(', ')}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge status={c.status} />
                      <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={(e) => handleCancelContract(c.id, e)}
                      className="p-2 rounded-lg hover:bg-error-light text-gray-400 hover:text-error transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="취소"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/customer/contracts/${c.id}`); }}>
                      서명하기
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Visit Reservations */}
      {!loading && activeVisits.length > 0 && (
        <>
          <h3 className="text-base font-semibold text-gray-800 mb-3">방문 예약</h3>
          <div className="space-y-2.5 mb-6">
            {activeVisits.map((v) => (
              <Card key={v.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{v.event?.name || '행사'}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Ticket className="w-3 h-3" />
                      <span>{formatDate(v.visitDate)}</span>
                      <span>{v.guestCount}명</span>
                    </div>
                  </div>
                  <Badge status="approved" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <Card hoverable onClick={() => router.push('/customer/contracts')} className="mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">내 계약</p>
              <p className="text-[13px] text-gray-500">전체 계약 내역 보기</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>

      {visits.length > 0 && (
        <Card hoverable onClick={() => router.push('/customer/reservations')} className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">방문 예약</p>
                <p className="text-[13px] text-gray-500">예약 내역 확인</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      )}

      {/* Recent Signed Contracts */}
      {!loading && signedContracts.length > 0 && (
        <>
          <h3 className="text-base font-semibold text-gray-800 mb-3 mt-6">완료된 계약</h3>
          <div className="space-y-2.5">
            {signedContracts.slice(0, 3).map((c) => (
              <Card key={c.id} hoverable onClick={() => router.push(`/customer/contracts/${c.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                    <p className="font-medium text-gray-800 text-sm mt-0.5">{c.event?.name || '계약서'}</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {c.partner?.name}
                      {(c.partner as any)?.items && (
                        <span className="text-gray-400 ml-1">· {(c.partner as any).items.split(',').map((s: string) => s.trim()).join(', ')}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge status={c.status} />
                      <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Integrated Contracts */}
      {!loading && filteredIcContracts.length > 0 && (
        <>
          <h3 className="text-base font-semibold text-gray-800 mb-3 mt-6">통합 계약</h3>
          <div className="space-y-2.5">
            {filteredIcContracts.slice(0, 5).map((ic) => (
              <Card key={ic.id} hoverable onClick={() => router.push(`/customer/integrated-contracts/${ic.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge status={ic.status} />
                      <span className="text-xs font-mono text-gray-400">{ic.shortCode}</span>
                    </div>
                    <p className="font-medium text-gray-800 text-sm mt-0.5 truncate">
                      {(ic as any).config?.event?.name || '통합계약서'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(ic as any).apartmentType?.name} · {ic.selectedItems?.length || 0}개 품목
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-blue-600 text-sm">{formatCurrency(ic.totalAmount)}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto mt-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Info */}
      <div className="bg-info-light border border-blue-200 rounded-xl p-4 mt-6">
        <p className="text-sm font-semibold text-blue-800 mb-1">QR 코드로 계약하기</p>
        <p className="text-[13px] text-blue-700 leading-relaxed">
          QR 코드 스캔 버튼을 누르면 카메라가 실행됩니다. 계약서 QR 코드 또는 방문예약 QR 코드를 스캔하세요.
        </p>
      </div>
    </div>
  );
}
