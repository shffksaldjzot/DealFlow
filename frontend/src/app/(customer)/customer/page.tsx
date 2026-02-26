'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { FileText, ChevronRight, AlertCircle, Camera, X, XCircle, Layers, QrCode, Calendar, Building2, Ticket } from 'lucide-react';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';
import { useToast } from '@/components/ui/Toast';
import type { IcContract } from '@/types/integrated-contract';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [icContracts, setIcContracts] = useState<IcContract[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitCode, setVisitCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<any>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancelClick = (contractId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCancelTarget({ id: contractId });
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.post(`/customer/contracts/${cancelTarget.id}/cancel`);
      toast('계약이 취소되었습니다.', 'success');
      fetchContracts();
    } catch {
      toast('취소에 실패했습니다.', 'error');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const pendingContracts = contracts.filter(
    (c) => c.status === 'pending' || c.status === 'in_progress',
  );

  const handleVisitCodeSubmit = () => {
    const trimmed = visitCode.trim().replace(/\s/g, '');
    if (trimmed.length >= 4) {
      router.push(`/events/${trimmed}/visit`);
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
    const { Html5Qrcode } = await import('html5-qrcode');
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
            let code = decodedText;
            const match = decodedText.match(/\/contract\/([^/?\s]+)/);
            if (match) code = match[1];
            const eventMatch = decodedText.match(/\/events\/([^/?\s]+)\/(visit|join|options)/);
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
          () => {},
        );
      } catch {
        setShowScanner(false);
        toast('카메라를 사용할 수 없습니다.', 'error');
      }
    }, 100);
  };

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
            <div className="flex items-center justify-between p-4 pt-[calc(16px+env(safe-area-inset-top))]">
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
                  방문 코드 QR을 스캔하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 와이어프레임 1-1: Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          안녕하세요. {user?.name || '고객'}님
        </h1>
        <p className="text-sm text-gray-500 mt-1">입주를 축하드립니다.</p>
      </div>

      {/* QR Scan Area (와이어프레임 1-1) */}
      <div
        onClick={handleQrScan}
        className="mb-5 bg-gradient-to-r from-[#1B3460] to-[#2E4A7A] rounded-2xl p-5 text-white cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">QR 코드 스캔</p>
            <p className="text-sm text-white/70 mt-0.5">방문 코드를 스캔하여 입장하세요</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </div>
      </div>

      {/* 방문 코드로 입장하기 (와이어프레임 1-1) */}
      <Card className="mb-5">
        <p className="text-sm font-semibold text-gray-700 mb-2">방문 코드로 입장하기</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={visitCode}
            onChange={(e) => setVisitCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleVisitCodeSubmit()}
            placeholder="8자리 코드 입력"
            maxLength={20}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-widest min-h-[44px] text-center"
          />
          <Button onClick={handleVisitCodeSubmit} disabled={visitCode.trim().length < 4}>
            입장
          </Button>
        </div>
      </Card>

      {/* 참여 행사 섹션 */}
      {!loading && visits.filter((v: any) => v.status === 'reserved').length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">참여 행사</h3>
          <div className="space-y-2">
            {visits
              .filter((v: any) => v.status === 'reserved')
              .map((visit: any) => {
                const eventData = visit.event;
                if (!eventData) return null;
                // 해당 행사의 IC 계약 찾기
                const matchingIc = icContracts.find(
                  (ic) => (ic as any).config?.event?.id === eventData.id || (ic as any).config?.eventId === eventData.id,
                );
                return (
                  <Card
                    key={visit.id}
                    hoverable
                    onClick={() => {
                      if (matchingIc) {
                        router.push(`/customer/integrated-contracts/${matchingIc.id}`);
                      } else {
                        router.push(`/events/${eventData.inviteCode}/options`);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{eventData.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {eventData.organizer?.name && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {eventData.organizer.name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(visit.visitDate)}
                          </span>
                        </div>
                        {matchingIc ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge status={matchingIc.status} />
                            <span className="text-xs font-medium text-blue-600">{formatCurrency(matchingIc.totalAmount)}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-blue-600 font-medium mt-1.5">옵션 선택 &rarr;</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Pending Contracts Alert */}
      {!loading && pendingContracts.length > 0 && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3.5 bg-warning-light border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              서명 대기 {pendingContracts.length}건
            </p>
            <p className="text-[13px] text-amber-700 mt-0.5">
              아래 계약서를 확인하고 서명해주세요
            </p>
          </div>
        </div>
      )}

      {/* Pending Contracts List */}
      {!loading && pendingContracts.length > 0 && (
        <div className="space-y-2.5 mb-5">
          {pendingContracts.map((c) => (
            <Card key={c.id} hoverable onClick={() => router.push(`/customer/contracts/${c.id}`)} className="border-l-[3px] border-l-warning">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{c.event?.name || '계약서'}</p>
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
                    onClick={(e) => handleCancelClick(c.id, e)}
                    className="p-2 rounded-lg hover:bg-error-light text-gray-400 hover:text-error transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="취소"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/customer/contracts/${c.id}`); }}>
                    서명
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Integrated Contracts */}
      {!loading && icContracts.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">최근 통합 계약</h3>
            {icContracts.length > 3 && (
              <button onClick={() => router.push('/customer/integrated-contracts')} className="text-xs text-blue-600 font-medium">
                더보기 &rarr;
              </button>
            )}
          </div>
          <div className="space-y-2">
            {icContracts.slice(0, 3).map((ic) => (
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
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-blue-600 text-sm">{formatCurrency(ic.totalAmount)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="계약 취소"
        message="이 계약을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다."
        confirmText="계약 취소"
        variant="danger"
        loading={cancelling}
      />
    </div>
  );
}
