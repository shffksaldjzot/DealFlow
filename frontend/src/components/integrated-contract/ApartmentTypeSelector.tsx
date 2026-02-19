'use client';
import { Home } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { IcApartmentType } from '@/types/integrated-contract';

interface ApartmentTypeSelectorProps {
  types: IcApartmentType[];
  selectedId?: string;
  onSelect: (type: IcApartmentType) => void;
}

export default function ApartmentTypeSelector({
  types,
  selectedId,
  onSelect,
}: ApartmentTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {types.map((type) => {
        const isSelected = type.id === selectedId;
        return (
          <button
            key={type.id}
            onClick={() => onSelect(type)}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              isSelected ? 'bg-blue-500' : 'bg-gray-100'
            }`}>
              <Home className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <p className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
              {type.name}
            </p>
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
