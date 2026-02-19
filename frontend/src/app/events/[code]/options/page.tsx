'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ApartmentTypeSelector from '@/components/integrated-contract/ApartmentTypeSelector';
import FloorPlanViewer from '@/components/integrated-contract/FloorPlanViewer';
import { ArrowRight, Home } from 'lucide-react';
import type { IcContractFlow, IcApartmentType } from '@/types/integrated-contract';

export default function OptionsTypePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [flow, setFlow] = useState<IcContractFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<IcApartmentType | null>(null);

  useEffect(() => {
    api.get(`/ic/contract-flow-by-code/${code}`)
      .then((res) => {
        const data = extractData<IcContractFlow>(res);
        setFlow(data);
        if (data.apartmentTypes.length === 1) {
          setSelectedType(data.apartmentTypes[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

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

  if (!flow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-900">통합 계약 설정을 찾을 수 없습니다</p>
          <p className="text-sm text-gray-500 mt-1">행사 정보를 확인해주세요.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">타입 선택</h1>
          <p className="text-sm text-gray-500 mt-1">원하시는 타입을 선택해주세요</p>
        </div>

        {/* Type Selection */}
        <ApartmentTypeSelector
          types={flow.apartmentTypes}
          selectedId={selectedType?.id}
          onSelect={setSelectedType}
        />

        {/* Floor Plan Preview */}
        {selectedType && (
          <Card>
            <h3 className="font-bold text-gray-900 mb-3">{selectedType.name} 평면도</h3>
            <FloorPlanViewer
              fileId={selectedType.floorPlanFileId}
              typeName={selectedType.name}
            />
          </Card>
        )}

        {/* Next Button */}
        <Button
          fullWidth
          size="lg"
          disabled={!selectedType}
          onClick={() => selectedType && router.push(`/events/${code}/options/${selectedType.id}`)}
        >
          옵션 선택하기
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
