'use client';
import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
