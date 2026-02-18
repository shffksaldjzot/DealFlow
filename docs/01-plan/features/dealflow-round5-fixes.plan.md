# Plan: DealFlow Round 5 Fixes

## Feature Overview
DealFlow 계약관리 플랫폼 Round 5 UX 개선 및 버그 수정

## Requirements (5 items)

### REQ-1: Contract Creation Flow Redesign
- **요구사항**: 계약 생성 프로세스를 다단계로 변경
- **플로우**: +계약생성 → 템플릿 선택 → 계약서 편집/미리보기 → 고객명+금액 입력 → QR코드
- **관련 파일**: `frontend/src/app/(partner)/partner/events/[id]/contracts/new/page.tsx`

### REQ-2: Admin User Detail Bug Fix
- **요구사항**: 관리자 > 사용자관리 > 사용자 상세 클릭 시 "사용자를 찾을 수 없습니다" 에러 수정
- **원인**: OrganizationMember 엔티티의 `joinedAt` 프로퍼티를 `createdAt`으로 잘못 참조
- **관련 파일**: `backend/src/modules/admin/admin.service.ts`

### REQ-3: New Organizer Event Creation Fix
- **요구사항**: 관리자가 생성한 주관사가 행사 생성 시 실패하는 문제 수정
- **원인**: admin createUser가 User만 생성하고 Organization/OrganizationMember 미생성
- **관련 파일**: `backend/src/modules/admin/admin.service.ts`, `admin.module.ts`

### REQ-4: Vendor Invite Code Join Fix
- **요구사항**: 관리자가 생성한 협력업체가 초대코드 입력 시 "소속된 조직이 없습니다" 에러
- **원인**: REQ-3과 동일 근본 원인 (조직 미생성)
- **관련 파일**: 동일

### REQ-5: Admin Password Reset Feature
- **요구사항**: 관리자가 회원 비밀번호를 임의로 리셋하는 기능
- **비즈니스**: 회원이 비밀번호 분실 시 관리자가 임시 비밀번호 발급 → 사용자에게 전달
- **관련 파일**: Backend DTO/Service/Controller + Frontend user detail page

## Acceptance Criteria

| REQ | Criteria | Priority |
|-----|----------|----------|
| REQ-1 | 4단계 위저드 (선택→편집→정보→QR) 동작 | High |
| REQ-2 | 사용자 상세 페이지에서 멤버십 포함 정보 정상 표시 | Critical |
| REQ-3 | 관리자 생성 주관사가 행사 생성 성공 | Critical |
| REQ-4 | 관리자 생성 협력업체가 초대코드로 행사 참여 성공 | Critical |
| REQ-5 | 임시 비밀번호 생성 → 해당 비밀번호로 로그인 성공 | High |

## Technical Scope

### Backend Changes
- `admin.service.ts`: getUserDetail 쿼리 수정, createUser 조직 자동생성, resetPassword 추가
- `admin.controller.ts`: POST users/:id/reset-password 엔드포인트 추가
- `admin.module.ts`: OrganizationMember 엔티티 등록
- `approve-organizer.dto.ts`: ResetPasswordDto 추가

### Frontend Changes
- `partner/events/[id]/contracts/new/page.tsx`: 4단계 위저드 전면 재작성
- `admin/users/[id]/page.tsx`: 비밀번호 리셋 모달 추가
