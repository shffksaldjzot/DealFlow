import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '대기',
    approved: '승인됨',
    rejected: '거절됨',
    suspended: '정지됨',
    active: '활성',
    draft: '초안',
    closed: '종료',
    cancelled: '취소됨',
    in_progress: '진행 중',
    signed: '서명 완료',
    completed: '계약 완료',
    withdrawn: '탈퇴',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    approved: 'bg-success-light text-[#166534]',
    active: 'bg-success-light text-[#166534]',
    rejected: 'bg-error-light text-[#991B1B]',
    suspended: 'bg-error-light text-[#991B1B]',
    cancelled: 'bg-gray-100 text-gray-600',
    draft: 'bg-gray-100 text-gray-600',
    closed: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    signed: 'bg-warning-light text-[#92400E]',
    completed: 'bg-success-light text-[#166534]',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}
