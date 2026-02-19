'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OptionsTypeRedirect() {
  const { code } = useParams<{ code: string; typeId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/events/${code}/options`);
  }, [code, router]);

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
