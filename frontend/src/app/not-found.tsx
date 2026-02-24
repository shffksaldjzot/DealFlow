import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-blue-600 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-gray-500 mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
