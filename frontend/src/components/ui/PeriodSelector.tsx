'use client';
import { useState } from 'react';

export interface PeriodValue {
  from: string | null;
  to: string | null;
  label: string;
}

interface PeriodSelectorProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
}

const presets = [
  { label: '오늘', days: 0 },
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '전체', days: -1 },
];

function getDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPresetRange(days: number): { from: string | null; to: string | null } {
  if (days === -1) return { from: null, to: null };
  const now = new Date();
  const to = getDateStr(now);
  if (days === 0) return { from: to, to };
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: getDateStr(from), to };
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(value.label === '기간지정');

  const handlePreset = (preset: typeof presets[number]) => {
    setShowCustom(false);
    const range = getPresetRange(preset.days);
    onChange({ ...range, label: preset.label });
  };

  const handleCustomToggle = () => {
    setShowCustom(true);
    onChange({ from: value.from, to: value.to, label: '기간지정' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.label}
          onClick={() => handlePreset(p)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            value.label === p.label
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
      <button
        onClick={handleCustomToggle}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          value.label === '기간지정'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        기간지정
      </button>
      {showCustom && (
        <div className="flex items-center gap-1.5 ml-1">
          <input
            type="date"
            value={value.from || ''}
            onChange={(e) => onChange({ ...value, from: e.target.value || null, label: '기간지정' })}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="date"
            value={value.to || ''}
            onChange={(e) => onChange({ ...value, to: e.target.value || null, label: '기간지정' })}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
