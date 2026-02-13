'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { FileText, ChevronRight, Clock, CheckCircle, AlertCircle, Ticket, Search, ChevronDown, Camera, X } from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { Contract } from '@/types/contract';
import type { EventVisit } from '@/types/event';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [visits, setVisits] = useState<EventVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractCode, setContractCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/customer/contracts').then((res) => setContracts(extractData(res))).catch(() => {}),
      api.get('/event-visits/my').then((res) => setVisits(extractData(res))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const pendingContracts = contracts.filter(
    (c) => c.status === 'pending' || c.status === 'in_progress',
  );
  const signedContracts = contracts.filter(
    (c) => c.status === 'signed' || c.status === 'completed',
  );
  const activeVisits = visits.filter((v) => v.status === 'reserved');

  const handleContractCodeSubmit = () => {
    const trimmed = contractCode.trim();
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
                <div id="qr-reader" className="rounded-2xl overflow-hidden" />
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
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name || '고객'}님
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          계약 현황을 확인하세요
        </p>
      </div>

      {/* QR Scan Button - prominent */}
      <button
        onClick={handleQrScan}
        className="w-full mb-4 flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors shadow-sm"
      >
        <Camera className="w-6 h-6" />
        <span className="text-lg font-bold">QR 코드 스캔</span>
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
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-2">계약 코드 입력</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleContractCodeSubmit()}
                    placeholder="계약 코드를 입력하세요"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
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

      {/* Pending Signing Alert */}
      {!loading && pendingContracts.length > 0 && (
        <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-800">
                서명 대기 중인 계약 {pendingContracts.length}건
              </p>
              <p className="text-sm text-orange-600 mt-0.5">
                아래 계약서를 확인하고 서명해주세요
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <div className="text-center">
            <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{loading ? '-' : contracts.length}</p>
            <p className="text-xs text-gray-500">전체</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Clock className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-orange-600">{loading ? '-' : pendingContracts.length}</p>
            <p className="text-xs text-gray-500">대기중</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-600">{loading ? '-' : signedContracts.length}</p>
            <p className="text-xs text-gray-500">완료</p>
          </div>
        </Card>
      </div>

      {/* Pending Contracts - highlighted */}
      {!loading && pendingContracts.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">서명 대기 계약</h3>
          <div className="space-y-2 mb-6">
            {pendingContracts.map((c) => (
              <Card key={c.id} hoverable onClick={() => router.push(`/customer/contracts/${c.id}`)} className="border-l-4 border-l-orange-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.event?.name || '계약서'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge status={c.status} />
                      <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/customer/contracts/${c.id}`); }}>
                    서명하기
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Visit Reservations */}
      {!loading && activeVisits.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">방문 예약</h3>
          <div className="space-y-2 mb-6">
            {activeVisits.map((v) => (
              <Card key={v.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{v.event?.name || '행사'}</p>
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
      <Card hoverable onClick={() => router.push('/customer/contracts')} className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">내 계약</p>
              <p className="text-sm text-gray-500">전체 계약 내역 보기</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>

      {visits.length > 0 && (
        <Card hoverable onClick={() => router.push('/customer/reservations')} className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">방문 예약</p>
                <p className="text-sm text-gray-500">예약 내역 확인</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      )}

      {/* Recent Signed Contracts */}
      {!loading && signedContracts.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6">완료된 계약</h3>
          <div className="space-y-2">
            {signedContracts.slice(0, 3).map((c) => (
              <Card key={c.id} hoverable onClick={() => router.push(`/customer/contracts/${c.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                    <p className="font-medium text-gray-900 text-sm mt-0.5">{c.event?.name || '계약서'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge status={c.status} />
                      <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-2xl p-5 mt-6">
        <p className="text-sm font-medium text-blue-800 mb-1">QR 코드로 계약하기</p>
        <p className="text-sm text-blue-600">
          QR 코드 스캔 버튼을 누르면 카메라가 실행됩니다. 계약서 QR 코드 또는 방문예약 QR 코드를 스캔하세요.
        </p>
      </div>
    </div>
  );
}
