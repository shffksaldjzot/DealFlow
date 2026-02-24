'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-error mb-4">!</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h1>
        <p className="text-sm text-gray-500 mb-6">잠시 후 다시 시도해주세요.</p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
