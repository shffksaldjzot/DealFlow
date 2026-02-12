'use client';
import { QRCodeSVG } from 'qrcode.react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface QRCodeDisplayProps {
  contractNumber: string;
  qrCode: string;
  qrCodeUrl: string;
}

export default function QRCodeDisplay({ contractNumber, qrCode, qrCodeUrl }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/contract/${qrCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <div className="text-center">
        <p className="text-xs text-gray-400 font-mono mb-1">{contractNumber}</p>
        <div className="inline-block p-4 bg-white rounded-xl border border-gray-100 my-3">
          <QRCodeSVG
            value={fullUrl}
            size={200}
            level="H"
            includeMargin
            fgColor="#1a1a1a"
          />
        </div>
        <p className="text-sm text-gray-500 mb-3">
          고객에게 이 QR 코드를 보여주세요
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 mr-1" /> 복사됨</>
          ) : (
            <><Copy className="w-3.5 h-3.5 mr-1" /> 링크 복사</>
          )}
        </Button>
      </div>
    </Card>
  );
}
