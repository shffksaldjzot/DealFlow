'use client';
import { usePathname } from 'next/navigation';

const PAGE_MAP: [RegExp, string, string][] = [
  // Auth (P01-P09)
  [/^\/$/, 'P01', '홈'],
  [/^\/login$/, 'P02', '로그인'],
  [/^\/signup\/business$/, 'P03', '회원가입'],
  [/^\/forgot-password$/, 'P04', '비밀번호 찾기'],
  [/^\/pending-approval$/, 'P05', '승인 대기'],

  // Admin (P10-P29)
  [/^\/admin$/, 'P10', '관리자 대시보드'],
  [/^\/admin\/events$/, 'P11', '행사 관리'],
  [/^\/admin\/events\/[^/]+$/, 'P12', '행사 상세'],
  [/^\/admin\/events\/[^/]+\/ic-config$/, 'P13', '통합계약 설정'],
  [/^\/admin\/contracts$/, 'P14', '계약 관리'],
  [/^\/admin\/contracts\/[^/]+$/, 'P15', '계약 상세'],
  [/^\/admin\/ic-contracts$/, 'P16', '통합계약 관리'],
  [/^\/admin\/ic-contracts\/[^/]+$/, 'P17', '통합계약 상세'],
  [/^\/admin\/organizers$/, 'P18', '주최사 관리'],
  [/^\/admin\/users$/, 'P19', '사용자 관리'],
  [/^\/admin\/users\/[^/]+$/, 'P20', '사용자 상세'],
  [/^\/admin\/logs$/, 'P21', '로그'],
  [/^\/admin\/notifications$/, 'P22', '알림'],

  // Organizer (P30-P49)
  [/^\/organizer$/, 'P30', '주최사 대시보드'],
  [/^\/organizer\/events$/, 'P31', '행사 목록'],
  [/^\/organizer\/events\/new$/, 'P32', '행사 생성'],
  [/^\/organizer\/events\/[^/]+$/, 'P33', '행사 상세'],
  [/^\/organizer\/events\/[^/]+\/partners$/, 'P34', '파트너 관리'],
  [/^\/organizer\/events\/[^/]+\/contracts$/, 'P35', '계약 목록'],
  [/^\/organizer\/events\/[^/]+\/contracts\/[^/]+$/, 'P36', '계약 상세'],
  [/^\/organizer\/events\/[^/]+\/ic-config$/, 'P37', '통합계약 설정'],
  [/^\/organizer\/events\/[^/]+\/ic-contracts$/, 'P38', '통합계약 목록'],
  [/^\/organizer\/events\/[^/]+\/ic-contracts\/[^/]+$/, 'P39', '통합계약 상세'],
  [/^\/organizer\/settings$/, 'P40', '설정'],
  [/^\/organizer\/notifications$/, 'P41', '알림'],

  // Partner (P50-P69)
  [/^\/partner$/, 'P50', '파트너 대시보드'],
  [/^\/partner\/events$/, 'P51', '행사 목록'],
  [/^\/partner\/events\/join$/, 'P52', '행사 참여'],
  [/^\/partner\/events\/[^/]+$/, 'P53', '행사 상세'],
  [/^\/partner\/events\/[^/]+\/templates\/new$/, 'P54', '템플릿 생성'],
  [/^\/partner\/events\/[^/]+\/templates\/[^/]+$/, 'P55', '템플릿 에디터'],
  [/^\/partner\/events\/[^/]+\/contracts\/new$/, 'P56', '계약 생성'],
  [/^\/partner\/contracts\/[^/]+$/, 'P57', '계약 상세'],
  [/^\/partner\/events\/[^/]+\/sheet$/, 'P58', '시트'],
  [/^\/partner\/events\/[^/]+\/sheet\/preview$/, 'P59', '시트 미리보기'],
  [/^\/partner\/events\/[^/]+\/ic-contracts$/, 'P60', '통합계약 목록'],
  [/^\/partner\/events\/[^/]+\/ic-contracts\/[^/]+$/, 'P61', '통합계약 상세'],
  [/^\/partner\/settings$/, 'P62', '설정'],
  [/^\/partner\/notifications$/, 'P63', '알림'],

  // Customer (P70-P89)
  [/^\/customer$/, 'P70', '고객 대시보드'],
  [/^\/customer\/contracts$/, 'P71', '계약 목록'],
  [/^\/customer\/contracts\/[^/]+$/, 'P72', '계약 상세'],
  [/^\/customer\/integrated-contracts$/, 'P73', '통합계약 목록'],
  [/^\/customer\/integrated-contracts\/[^/]+$/, 'P74', '통합계약 상세'],
  [/^\/customer\/reservations$/, 'P75', '예약'],
  [/^\/customer\/profile$/, 'P76', '프로필'],
  [/^\/customer\/notifications$/, 'P77', '알림'],

  // Public (P90-P99)
  [/^\/contract\/[^/]+\/login$/, 'P90', '계약 로그인'],
  [/^\/contract\/[^/]+$/, 'P91', '계약서'],
  [/^\/contract\/[^/]+\/sign$/, 'P92', '서명'],
  [/^\/contract\/[^/]+\/complete$/, 'P93', '계약 완료'],
  [/^\/contract\/[^/]+\/view$/, 'P94', '계약 보기'],
  [/^\/events\/[^/]+\/visit$/, 'P95', '행사 방문'],
  [/^\/events\/[^/]+\/join$/, 'P96', '행사 참여'],
  [/^\/events\/[^/]+\/options$/, 'P97', '옵션 선택'],
  [/^\/events\/[^/]+\/options\/[^/]+$/, 'P98', '옵션 상세'],
];

export default function PageId() {
  const pathname = usePathname();

  // Match longest (most specific) pattern first - array is ordered specific-first
  const match = PAGE_MAP.find(([regex]) => regex.test(pathname));
  if (!match) return null;

  const [, code, name] = match;

  return (
    <div className="fixed bottom-2 right-2 z-50 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded font-mono pointer-events-none select-none">
      {code} {name}
    </div>
  );
}
