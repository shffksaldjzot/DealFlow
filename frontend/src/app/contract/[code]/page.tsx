'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import type { Contract } from '@/types/contract';

export default function ContractEntryPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/contract-flow/${code}`)
      .then((res) => setContract(extractData(res)))
      .catch((err) => {
        setError(err.response?.data?.message?.[0] || '올바른 계약 코드를 입력해주세요.');
      })
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (!authLoading && !loading && contract) {
      if (!isAuthenticated) {
        router.push(`/contract/${code}/login`);
      } else {
        router.push(`/contract/${code}/view`);
      }
    }
  }, [authLoading, loading, isAuthenticated, contract, code, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">계약서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>
            홈으로
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
