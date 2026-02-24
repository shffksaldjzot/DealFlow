# DealFlow 웹 디자인 가이드라인 v1.0

## 서비스 개요
DealFlow는 입주박람회(하우징 전시회) 전용 B2B2C 계약 자동화 SaaS 플랫폼입니다.
고객이 QR코드를 스캔해 모바일에서 계약서를 작성하고 전자서명합니다.
사용자 역할: 고객(Customer), 주관사(Organizer), 협력업체(Partner), 관리자(Admin)
기술 스택: Next.js + Tailwind CSS (프론트엔드), NestJS + PostgreSQL (백엔드)

---

## 1. 컬러 시스템

### Primary — Navy (신뢰·전문성)
주요 CTA, 링크, 선택 상태에 사용. 600을 기본으로 사용.

| 단계 | HEX     | 용도                          |
|------|---------|-------------------------------|
| 50   | #EEF1F8 | 배경 하이라이트, hover 배경      |
| 100  | #D4DAE8 | 배지 배경, 선택 배경            |
| 200  | #A9B5D1 | 비활성 보더, 구분선             |
| 300  | #7E90BA | 보조 텍스트 (밝은 배경 위)      |
| 400  | #536BA3 | 아이콘, 보조 강조              |
| 500  | #2E4A7A | hover 상태 버튼               |
| 600  | #1B3460 | ★ 기본 버튼, 링크, 주요 CTA     |
| 700  | #152A50 | hover/active 상태             |
| 800  | #0F2040 | 진한 텍스트, 헤더 배경          |
| 900  | #0A1628 | 최상위 배경 (다크 모드)         |

### Secondary — Teal (안정·완료)
성공 상태, 완료, 보조 강조에 사용.

| 단계 | HEX     | 용도                          |
|------|---------|-------------------------------|
| 50   | #EDFCF8 | 성공 배경                      |
| 100  | #D2F7ED | 성공 배지 배경                  |
| 200  | #A8EEDC | 보조 강조                      |
| 300  | #70DFC8 | 아이콘                         |
| 400  | #38C8AE | 활성 상태                      |
| 500  | #1AAD96 | ★ 기본 보조 컬러               |
| 600  | #108B7A | hover 상태                    |
| 700  | #107064 | 진한 강조                      |
| 800  | #115951 | 텍스트                         |
| 900  | #134943 | 다크 배경                      |

### Accent — Amber (주의환기)
경고, 강조, 프로모션에 사용.

| 단계 | HEX     |
|------|---------|
| 50   | #FFFBEB |
| 100  | #FEF3C7 |
| 200  | #FDE68A |
| 300  | #FCD34D |
| 400  | #FBBF24 |
| 500  | #F59E0B |
| 600  | #D97706 |

### Semantic Colors (시맨틱)

| 이름    | 기본 HEX  | Light HEX | 용도                   |
|---------|-----------|-----------|------------------------|
| Success | #16A34A   | #DCFCE7   | 완료, 성공, 서명 완료    |
| Warning | #F59E0B   | #FEF9C3   | 주의, 대기 중, 기한 임박 |
| Error   | #DC2626   | #FEE2E2   | 오류, 실패, 반려         |
| Info    | #2563EB   | #DBEAFE   | 안내, 정보, 링크         |

### Neutral — Gray

| 단계 | HEX     | 용도                          |
|------|---------|-------------------------------|
| 50   | #F8FAFC | 페이지 배경                    |
| 100  | #F1F5F9 | 카드 내부 배경, 테이블 헤더     |
| 200  | #E2E8F0 | 보더, 구분선                   |
| 300  | #CBD5E1 | 비활성 보더                    |
| 400  | #94A3B8 | placeholder, 캡션             |
| 500  | #64748B | 보조 텍스트                    |
| 600  | #475569 | 본문 텍스트 (보조)             |
| 700  | #334155 | 본문 텍스트 (기본)             |
| 800  | #1E293B | 제목                           |
| 900  | #0F172A | 최상위 제목, 다크 배경          |

---

## 2. 타이포그래피

### 폰트 패밀리
- Display (제목): Plus Jakarta Sans (영문) + Pretendard (한글)
- Body (본문): Pretendard
- Mono (코드, 계약번호): JetBrains Mono 또는 Fira Code

### 텍스트 스케일

| 용도            | 크기   | 굵기        | 행간     | 폰트      |
|----------------|--------|-------------|----------|-----------|
| Display        | 32px   | 800 (ExBd)  | 1.3      | Display   |
| Heading 1      | 24px   | 700 (Bold)  | 1.3      | Display   |
| Heading 2      | 20px   | 600 (SemBd) | 1.4      | Display   |
| Heading 3      | 16px   | 600 (SemBd) | 1.4      | Body      |
| Body           | 14px   | 400 (Reg)   | 1.6~1.7  | Body      |
| Body Small     | 13px   | 400 (Reg)   | 1.5      | Body      |
| Caption        | 12px   | 500 (Med)   | 1.4      | Body      |
| Overline       | 11px   | 600 (SemBd) | 1.3      | Body      |

### 텍스트 컬러 규칙
- 제목: Gray-900 (#0F172A) 또는 Gray-800 (#1E293B)
- 본문: Gray-700 (#334155)
- 보조 텍스트: Gray-500 (#64748B)
- 비활성/placeholder: Gray-400 (#94A3B8)
- 링크: Primary-600 (#1B3460), hover 시 Primary-700

---

## 3. 여백 (Spacing)

4px 단위 시스템:

| 변수명      | 값   | 주요 용도                      |
|------------|------|-------------------------------|
| space-1    | 4px  | 아이콘-텍스트 간격              |
| space-2    | 8px  | 인라인 요소 간격               |
| space-3    | 12px | 폼 라벨-인풋 간격              |
| space-4    | 16px | 카드 내부 요소 간격             |
| space-5    | 20px | 입력 필드 패딩                 |
| space-6    | 24px | 카드 패딩                      |
| space-8    | 32px | 섹션 내부 패딩                 |
| space-10   | 40px | 섹션 간 간격                   |
| space-12   | 48px | 큰 섹션 간 간격                |
| space-16   | 64px | 페이지 블록 간 간격             |

---

## 4. 보더 라디우스

| 이름    | 값     | 용도                          |
|---------|--------|-------------------------------|
| sm      | 6px    | 배지, 작은 태그                |
| md      | 8px    | 버튼, 인풋                     |
| lg      | 12px   | 카드, 드롭다운                 |
| xl      | 16px   | 모달, 큰 카드                  |
| 2xl     | 20px   | 풀 카드, 히어로 섹션           |
| full    | 9999px | 아바타, 배지 pill              |

---

## 5. 그림자

| 이름  | 값                                                              | 용도            |
|-------|----------------------------------------------------------------|-----------------|
| xs    | 0 1px 2px rgba(0,0,0,0.05)                                     | 인풋 기본        |
| sm    | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)         | 카드 기본        |
| md    | 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06) | 카드 hover     |
| lg    | 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) | 드롭다운, 토스트 |
| xl    | 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04) | 모달          |
| focus | 0 0 0 3px rgba(27, 52, 96, 0.25)                               | 포커스 링       |

---

## 6. 버튼

### 스타일 종류

| 스타일     | 배경             | 텍스트        | 보더            | 용도                      |
|-----------|-----------------|--------------|-----------------|--------------------------|
| Primary   | Primary-600     | white        | 없음            | 주요 행동 (서명, 저장, 승인) |
| Secondary | white           | Gray-700     | Gray-300        | 보조 행동 (취소, 미리보기)   |
| Ghost     | transparent     | Primary-600  | 없음            | 부가 행동 (더보기, 링크)     |
| Danger    | Error (#DC2626) | white        | 없음            | 위험 행동 (삭제, 반려)      |
| Success   | Success (#16A34A)| white       | 없음            | 긍정 행동 (승인, 완료)      |

### 크기

| 크기   | font-size | padding       | radius |
|--------|-----------|---------------|--------|
| sm     | 13px      | 6px 14px      | md     |
| default| 14px      | 10px 20px     | md     |
| lg     | 16px      | 12px 28px     | md     |
| xl     | 18px      | 16px 36px     | lg     |

### 상태
- hover: 배경 한 단계 어둡게 + shadow-sm
- active: 배경 두 단계 어둡게
- disabled: opacity 0.45, cursor not-allowed
- focus: shadow-focus 링 적용

---

## 7. 폼 요소

### Input
- 패딩: 10px 14px
- 폰트: 14px, Body
- 보더: 1px solid Gray-300
- radius: md (8px)
- focus: 보더 Primary-500 + shadow-focus
- error: 보더 Error + error shadow
- readonly: 배경 Gray-50
- placeholder: Gray-400

### Select
- Input과 동일 스타일
- 우측 chevron 아이콘 (SVG background-image)
- padding-right: 36px

### Checkbox / Radio
- 크기: 18px × 18px
- accent-color: Primary-600
- 라벨 간격: space-3 (12px)
- 라벨 폰트: 14px, Gray-700

### 라벨
- 폰트: 14px, SemiBold (600)
- 컬러: Gray-700
- 필수 표시: 빨간색 * (::after)
- 라벨-인풋 간격: space-2 (8px)

### 도움말/에러 텍스트
- 도움말: 13px, Gray-500
- 에러: 13px, Error (#DC2626)
- 간격: space-1 (4px) from input

---

## 8. 카드

### 기본 카드
- 배경: white
- 보더: 1px solid Gray-200
- radius: xl (16px)
- 패딩: space-6 (24px)
- hover: shadow-md
- 전환: 200ms ease

### 카드 내부 구조
- Header: flex, space-between, margin-bottom space-4
- Title: Display 폰트, 18px, Bold (700), Gray-900
- Description: 14px, Gray-500
- Footer: 버튼 그룹, gap space-2

---

## 9. 배지 (Badge)

### 스타일

| 종류     | 배경           | 텍스트         | 용도              |
|---------|---------------|---------------|-------------------|
| Primary | Primary-100   | Primary-700   | 정보, 기본 태그     |
| Success | Success-light | Success       | 완료, 활성         |
| Warning | Warning-light | #92400E       | 대기, 주의         |
| Error   | Error-light   | Error         | 오류, 만료         |
| Gray    | Gray-100      | Gray-600      | 비활성, 종료       |

### 크기/스타일
- 폰트: 12px, SemiBold (600)
- 패딩: 3px 10px
- radius: full (pill)
- dot 변형: 6px 원형 도트 (currentColor) 텍스트 앞에

### 계약 상태 매핑

| 상태         | 배지 종류  | 라벨          |
|-------------|-----------|---------------|
| pending     | Gray      | 대기           |
| in_progress | Primary   | 진행 중        |
| signed      | Warning   | 서명 완료      |
| completed   | Success   | 계약 완료      |

### 사용자 역할 매핑

| 역할     | 배경      | 텍스트    |
|---------|-----------|----------|
| Admin   | #EDE9FE   | #6D28D9  |
| Organizer| #FFF7ED  | #C2410C  |
| Partner | #ECFDF5   | #059669  |
| Customer| Primary-100| Primary-700|

---

## 10. 테이블

### 기본 스타일
- 컨테이너: 1px solid Gray-200, radius lg, overflow hidden
- 헤더(th): 배경 Gray-50, 13px SemiBold, Gray-600, 패딩 12px 16px
- 셀(td): 14px, Gray-700, 패딩 12px 16px
- 행 구분: 1px solid Gray-100
- 마지막 행: 하단 보더 없음
- hover: 행 배경 Gray-50

### 셀 타입별 스타일
- 계약번호: Mono 폰트, 13px
- 금액: SemiBold (600)
- 날짜: 13px, Gray-500
- 상태: 배지 컴포넌트 사용
- 사용자: 아바타(32px) + 이름 조합

---

## 11. 모달

### 구조
- 오버레이: rgba(15, 23, 42, 0.5) — 클릭 시 닫기
- 모달 컨테이너: white, radius xl, shadow-xl, max-width 480px
- Header: 제목 + 닫기 버튼, 하단 보더 Gray-100
- Body: 패딩 space-6
- Footer: 배경 Gray-50, 상단 보더, 버튼 우측 정렬

### 제목
- Display 폰트, 18px, Bold (700), Gray-900

### 닫기 버튼
- 32px × 32px, 배경 없음, x 텍스트
- hover: 배경 Gray-100

---

## 12. 알림 (Alert)

### 4가지 타입

| 타입    | 배경      | 텍스트    | 보더      | 아이콘 |
|---------|-----------|----------|-----------|--------|
| Info    | #DBEAFE   | #1E40AF  | #BFDBFE   | info   |
| Success | #DCFCE7   | #166534  | #BBF7D0   | check  |
| Warning | #FEF9C3   | #92400E  | #FDE68A   | alert  |
| Error   | #FEE2E2   | #991B1B  | #FECACA   | error  |

### 스타일
- 패딩: 16px 20px
- radius: lg (12px)
- 폰트: 14px, 행간 1.5
- 아이콘: 18px, flex-shrink 0
- 레이아웃: flex, gap 12px

### 토스트 알림
- 배경: Gray-900
- 텍스트: white
- radius: lg
- shadow: lg
- 폰트: 14px
- max-width: 400px
- 위치: 화면 우상단 고정

---

## 13. 대시보드 통계 카드

### 구조
- 배경: white, 보더 Gray-200, radius xl
- 패딩: space-6 (24px)
- Label: 13px, Medium, Gray-500
- Value: Display 폰트, 32px, ExtraBold (800), Gray-900, letter-spacing -1px
- Change: 13px, SemiBold
  - 상승: Success 컬러 + up arrow
  - 하락: Error 컬러 + down arrow

---

## 14. 탭

### 스타일
- 하단 보더: 2px solid Gray-200
- 탭 아이템: 14px, Medium, Gray-500, 패딩 12px 20px
- hover: Gray-700
- active: Primary-600, SemiBold, 하단 2px Primary-600 라인
- 전환: 150ms ease

---

## 15. 프로그레스 바

### 스타일
- 트랙: 높이 8px, Gray-200, radius full
- 채움: radius full, transition width 300ms
- 컬러 매핑:
  - 일반 진행: Primary-500
  - 완료 관련: Secondary-500
  - 위험/기한: Error (#DC2626)

---

## 16. 아바타

### 크기

| 크기 | 값   | 폰트  |
|------|------|-------|
| sm   | 32px | 12px  |
| md   | 40px | 15px  |
| lg   | 48px | 18px  |

### 스타일
- 원형 (border-radius 50%)
- 배경: 역할/사용자별 Primary-100, Secondary-100, Accent-100 등
- 텍스트: 해당 컬러 700단계, Bold
- 이름 첫 글자(한글 성) 표시

---

## 17. 트랜지션

| 이름  | 값         | 용도                |
|-------|-----------|---------------------|
| fast  | 150ms ease | hover, 포커스        |
| base  | 200ms ease | 카드, 일반 전환       |
| slow  | 300ms ease | 프로그레스, 모달 진입  |

---

## 18. 반응형 (Responsive)

### 브레이크포인트

| 이름   | 값      | 대상                          |
|--------|---------|-------------------------------|
| sm     | 640px   | 모바일 가로, 소형 기기          |
| md     | 768px   | 태블릿 세로                    |
| lg     | 1024px  | 태블릿 가로, 소형 노트북        |
| xl     | 1280px  | 데스크탑                       |
| 2xl    | 1536px  | 대형 모니터                    |

Tailwind CSS 기준 mobile-first 방식 사용. 기본 스타일이 모바일이고 sm: md: lg: 등으로 확장.

### 레이아웃 규칙

| 요소           | 모바일 (~767px)       | 태블릿 (768~1023px)   | 데스크탑 (1024px~)     |
|---------------|----------------------|----------------------|----------------------|
| 컨테이너 max-w | 100%                 | 720px                | 1200px               |
| 컨테이너 패딩   | 16px (space-4)       | 24px (space-6)       | 32px (space-8)       |
| 그리드 컬럼     | 1열                  | 2열                  | 3~4열                |
| 사이드바       | 하단 탭 또는 숨김      | 접이식 (collapse)     | 고정 사이드바 (240px)  |
| 테이블         | 카드형 변환 또는 스크롤 | 가로 스크롤            | 기본 테이블           |
| 모달           | 풀스크린 (bottom sheet)| 중앙 480px           | 중앙 480~560px       |
| 폰트 Display   | 24px                 | 28px                 | 32px                 |
| 폰트 Heading 1 | 20px                 | 22px                 | 24px                 |

### 컴포넌트별 반응형 규칙

**네비게이션**
- 모바일: 하단 고정 탭바 (최대 5개 아이템), 높이 56px, safe-area-inset 대응
- 태블릿: 좌측 접이식 사이드바 (아이콘만 표시, 64px)
- 데스크탑: 좌측 고정 사이드바 (아이콘+텍스트, 240px)

**카드 그리드**
- 모바일: 1열, gap space-4 (16px)
- 태블릿: 2열, gap space-4 (16px)
- 데스크탑: 3열 이상, gap space-6 (24px)
```
grid-template-columns:
  모바일   -> 1fr
  md(768)  -> repeat(2, 1fr)
  lg(1024) -> repeat(3, 1fr)
  xl(1280) -> repeat(4, 1fr)  /* 대시보드 통계카드 등 */
```

**대시보드 통계 카드**
- 모바일: 2열 (2x2)
- 태블릿: 2열 또는 4열
- 데스크탑: 4열 가로 배치

**테이블**
- 모바일: 가로 스크롤 (overflow-x: auto) 또는 카드형 변환. 카드형 변환 시 각 행을 개별 카드로 표시, th는 라벨로 변환
- 태블릿 이상: 기본 테이블 레이아웃 유지

**폼**
- 모바일: 1열 풀너비, 인풋 높이 최소 44px (터치 타겟)
- 태블릿 이상: 2열 그리드 가능 (예: 이름/연락처 나란히)
- 라벨: 항상 인풋 상단 배치 (인라인 라벨 사용 금지)

**버튼**
- 모바일: 풀너비 (width 100%) 또는 하단 고정 (sticky bottom)
- 태블릿 이상: 인라인 배치, auto width
- 주요 CTA(서명, 결제): 모바일에서 하단 고정 바로 표시
```css
/* 모바일 하단 고정 CTA 바 */
position: fixed;
bottom: 0;
left: 0;
right: 0;
padding: 12px 16px;
padding-bottom: calc(12px + env(safe-area-inset-bottom));
background: white;
border-top: 1px solid Gray-200;
box-shadow: shadow-lg;
z-index: 50;
```

**모달**
- 모바일: bottom sheet 스타일 (하단에서 올라옴, 풀너비, 상단 radius xl)
- 태블릿 이상: 중앙 정렬, max-width 480px

**배지/아바타**
- 모든 해상도에서 동일 크기 유지 (반응형 변경 없음)

**탭**
- 모바일: 가로 스크롤 (overflow-x: auto, -webkit-overflow-scrolling: touch)
- 태블릿 이상: 기본 배치

### 터치 타겟 규칙 (모바일)
- 모든 인터랙티브 요소: 최소 44px x 44px
- 버튼 간 간격: 최소 8px
- 체크박스/라디오 터치 영역: 라벨 전체 포함
- 링크 텍스트: 최소 높이 44px (padding으로 확보)

### safe-area 대응 (노치/홈바)
```css
/* iOS safe area */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```
- 하단 고정 요소(CTA바, 탭바): padding-bottom에 safe-area-inset-bottom 반드시 적용
- 상단 헤더: padding-top에 safe-area-inset-top 적용

### Tailwind 반응형 예시
```html
<!-- 카드 그리드 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">

<!-- 컨테이너 -->
<div class="max-w-full md:max-w-[720px] lg:max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">

<!-- 모바일 풀너비 버튼 -> 데스크탑 인라인 -->
<button class="w-full md:w-auto">

<!-- 모바일 1열 -> 데스크탑 2열 폼 -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">

<!-- 모바일 하단 고정 CTA -->
<div class="fixed bottom-0 left-0 right-0 p-4 pb-[calc(12px+env(safe-area-inset-bottom))] bg-white border-t border-gray-200 shadow-lg z-50 md:static md:shadow-none md:border-0 md:p-0">

<!-- 모바일 텍스트 크기 조절 -->
<h1 class="text-2xl md:text-[28px] lg:text-[32px] font-extrabold">
```

---

## 19. 디자인 원칙

### 명확함 (Clarity)
계약서는 법적 효력을 가진다. 모든 UI는 사용자가 혼동 없이 정확하게 이해할 수 있어야 한다. 애매한 라벨, 숨겨진 동작을 피한다.

### 모바일 우선 (Mobile First)
고객은 QR코드를 스캔해 모바일에서 계약한다. 터치 타겟은 최소 44px, 입력 필드는 충분한 크기를 유지한다.

### 즉각적 피드백 (Feedback)
서명, 결제, 저장 등 모든 동작에 즉각적인 시각적 피드백을 제공한다. 로딩 상태, 성공/실패를 명확히 구분한다.

### 신뢰감 (Trust)
계약과 결제를 다루는 서비스이다. 안정적인 컬러, 충분한 여백, 정돈된 레이아웃으로 전문성과 신뢰감을 전달한다.

---

## 20. CSS 변수 전체 목록 (복사용)

```css
:root {
  /* Primary - Navy */
  --df-primary-50: #EEF1F8;
  --df-primary-100: #D4DAE8;
  --df-primary-200: #A9B5D1;
  --df-primary-300: #7E90BA;
  --df-primary-400: #536BA3;
  --df-primary-500: #2E4A7A;
  --df-primary-600: #1B3460;
  --df-primary-700: #152A50;
  --df-primary-800: #0F2040;
  --df-primary-900: #0A1628;

  /* Secondary - Teal */
  --df-secondary-50: #EDFCF8;
  --df-secondary-100: #D2F7ED;
  --df-secondary-200: #A8EEDC;
  --df-secondary-300: #70DFC8;
  --df-secondary-400: #38C8AE;
  --df-secondary-500: #1AAD96;
  --df-secondary-600: #108B7A;
  --df-secondary-700: #107064;
  --df-secondary-800: #115951;
  --df-secondary-900: #134943;

  /* Accent - Amber */
  --df-accent-50: #FFFBEB;
  --df-accent-100: #FEF3C7;
  --df-accent-200: #FDE68A;
  --df-accent-300: #FCD34D;
  --df-accent-400: #FBBF24;
  --df-accent-500: #F59E0B;
  --df-accent-600: #D97706;

  /* Semantic */
  --df-success: #16A34A;
  --df-success-light: #DCFCE7;
  --df-warning: #F59E0B;
  --df-warning-light: #FEF9C3;
  --df-error: #DC2626;
  --df-error-light: #FEE2E2;
  --df-info: #2563EB;
  --df-info-light: #DBEAFE;

  /* Gray */
  --df-gray-50: #F8FAFC;
  --df-gray-100: #F1F5F9;
  --df-gray-200: #E2E8F0;
  --df-gray-300: #CBD5E1;
  --df-gray-400: #94A3B8;
  --df-gray-500: #64748B;
  --df-gray-600: #475569;
  --df-gray-700: #334155;
  --df-gray-800: #1E293B;
  --df-gray-900: #0F172A;

  /* Typography */
  --font-display: 'Plus Jakarta Sans', 'Pretendard', -apple-system, sans-serif;
  --font-body: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
  --shadow-focus: 0 0 0 3px rgba(27, 52, 96, 0.25);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

*DealFlow Design Guideline v1.0*
