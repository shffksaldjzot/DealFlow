'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import ContractPreview from '@/components/integrated-contract/ContractPreview';
import IcContractPrintView from '@/components/integrated-contract/IcContractPrintView';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { IcContract, IcContractFlow } from '@/types/integrated-contract';

export default function CustomerIntegratedContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<IcContract | null>(null);
  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/ic/contracts/${id}`)
      .then(async (res) => {
        const c = extractData<IcContract>(res);
        setContract(c);
        // Load full flow for displaying all options with checkmarks
        if (c.config?.eventId) {
          try {
            const flowRes = await api.get(`/ic/contract-flow/${c.config.eventId}`);
            setFlow(extractData(flowRes));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!printRef.current || !contract) return;
    setDownloading(true);
    try {
      // Temporarily make the print view visible for capture
      const el = printRef.current;
      el.style.display = 'block';
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      el.style.top = '0';
      el.style.width = '800px';
      el.style.background = 'white';
      el.style.padding = '40px';

      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Hide again
      el.style.display = 'none';
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.padding = '';

      const link = document.createElement('a');
      link.download = `계약서_${contract.shortCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Fallback: open print dialog for PDF save
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/customer/integrated-contracts" />
        <Card>
          <p className="text-center text-gray-500">계약을 찾을 수 없습니다.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="print-hidden">
        <PageHeader
          title="계약 상세"
          backHref="/customer/integrated-contracts"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                {downloading ? '다운로드 중...' : '다운로드'}
              </button>
              <Badge status={contract.status} />
            </div>
          }
        />
        <Card>
          <ContractPreview contract={contract} flow={flow} />
        </Card>
      </div>

      {/* Hidden Print View for download capture */}
      <div ref={printRef} style={{ display: 'none' }}>
        <IcContractPrintView contract={contract} flow={flow} />
      </div>
    </>
  );
}
