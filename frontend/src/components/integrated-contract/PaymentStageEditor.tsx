'use client';
import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { PaymentStage } from '@/types/integrated-contract';

interface PaymentStageEditorProps {
  stages: PaymentStage[];
  onChange: (stages: PaymentStage[]) => void;
  disabled?: boolean;
}

export default function PaymentStageEditor({
  stages,
  onChange,
  disabled,
}: PaymentStageEditorProps) {
  const totalRatio = stages.reduce((sum, s) => sum + s.ratio, 0);
  const isValid = Math.abs(totalRatio - 100) < 0.01;

  const addStage = () => {
    const remaining = 100 - totalRatio;
    onChange([...stages, { name: '', ratio: remaining > 0 ? remaining : 0 }]);
  };

  const updateStageName = (index: number, name: string) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  };

  const updateStageRatio = (index: number, value: string) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], ratio: Number(value) || 0 };
    onChange(updated);
  };

  const removeStage = (index: number) => {
    onChange(stages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">결제 단계</label>
        {!disabled && (
          <Button variant="ghost" size="sm" onClick={addStage}>
            <Plus className="w-4 h-4 mr-1" />
            단계 추가
          </Button>
        )}
      </div>

      {stages.length === 0 ? (
        <p className="text-sm text-gray-400">일시불 (단계 미설정)</p>
      ) : (
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={stage.name}
                onChange={(e) => updateStageName(index, e.target.value)}
                placeholder={`${index + 1}차`}
                disabled={disabled}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={stage.ratio}
                  onChange={(e) => updateStageRatio(index, e.target.value)}
                  min={0}
                  max={100}
                  disabled={disabled}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              {!disabled && (
                <button
                  onClick={() => removeStage(index)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {stages.length > 0 && (
        <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-600' : 'text-red-500'}`}>
          {!isValid && <AlertCircle className="w-4 h-4" />}
          <span>합계: {totalRatio}% {!isValid && '(100%가 되어야 합니다)'}</span>
        </div>
      )}
    </div>
  );
}
