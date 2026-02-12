# DealFlow - MVP 설계 문서
## 입주박람회 기반 B2B2C 계약 자동화 SaaS 플랫폼

---

## 1. 전체 페이지 구조 (Sitemap)

```
/                                    → 랜딩 페이지 (서비스 소개)
/login                               → 로그인 (역할 선택 포함)
/signup                              → 회원가입 (역할별 분기)
/signup/business                     → 사업자등록증 업로드 (주관사/협력업체)
/pending-approval                    → 승인 대기 안내 페이지

── 고객 (Customer) ──
/customer                            → 고객 홈 (계약 목록)
/customer/contracts                  → 내 계약 내역
/customer/contracts/[id]             → 계약 상세 (PDF 다운로드)
/customer/profile                    → 프로필 / 설정

── 계약 플로우 (QR 진입) ──
/contract/[code]                     → QR 스캔 진입점
/contract/[code]/login               → 간편 로그인 유도
/contract/[code]/view                → 계약 내용 확인
/contract/[code]/sign                → 전자서명
/contract/[code]/complete            → 계약 완료

── 주관사 (Organizer) ──
/organizer                           → 대시보드 (행사 요약)
/organizer/events                    → 행사 목록
/organizer/events/new                → 행사 생성
/organizer/events/[id]               → 행사 상세
/organizer/events/[id]/partners      → 협력업체 관리 (승인/거절)
/organizer/events/[id]/contracts     → 행사별 계약 현황
/organizer/events/[id]/settings      → 행사 설정 (수수료율 등)
/organizer/profile                   → 업체 프로필

── 협력업체 (Partner) ──
/partner                             → 대시보드 (행사별 계약 요약)
/partner/events                      → 참여 행사 목록
/partner/events/join                 → 초대코드 입력 (행사 참여 신청)
/partner/events/[id]                 → 행사 상세
/partner/events/[id]/contracts       → 행사별 계약 목록
/partner/events/[id]/contracts/new   → 계약 생성 (PDF 업로드 + 필드 배치)
/partner/events/[id]/contracts/[cid] → 계약 상세 (QR 확인, 상태)
/partner/profile                     → 업체 프로필

── 슈퍼어드민 (Super Admin) ──
/admin                               → 대시보드 (전체 현황)
/admin/organizers                    → 주관사 관리 (승인/거절)
/admin/organizers/[id]               → 주관사 상세
/admin/users                         → 전체 사용자 관리
/admin/events                        → 전체 행사 관리
/admin/events/[id]                   → 행사 상세
/admin/contracts                     → 전체 계약 관리
/admin/contracts/[id]                → 계약 상세
```

---

## 2. 역할별 화면 플로우

### 2-1. 고객 (Customer) 플로우

```
[QR 스캔]
  → /contract/[code] (계약 진입)
  → 로그인 여부 확인
     ├─ 미로그인 → /contract/[code]/login (SNS 간편 로그인)
     └─ 로그인됨 → /contract/[code]/view (계약 내용 확인)
  → 계약 내용 확인
     ├─ PDF/이미지 뷰어로 계약서 표시
     ├─ 오버레이된 입력 필드 (텍스트/체크박스/금액) 채움
     └─ "계약 내용에 동의합니다" 체크
  → /contract/[code]/sign (전자서명)
     └─ 터치/마우스 서명 패드
  → /contract/[code]/complete (완료)
     ├─ 서명된 PDF 생성 → S3 저장
     ├─ 카카오 알림톡 + 푸시 + 이메일 발송
     └─ "내 계약 보기" CTA → /customer/contracts/[id]
```

### 2-2. 주관사 (Organizer) 플로우

```
[회원가입]
  → /signup (역할: 주관사 선택)
  → /signup/business (사업자등록증 업로드)
  → /pending-approval (어드민 승인 대기)
  → 승인 완료 알림 → /organizer

[행사 생성]
  → /organizer/events/new
     ├─ 행사명, 기간(달력 UI), 장소 입력
     ├─ 비공개 설정 (기본 ON)
     └─ 초대코드 자동 생성
  → /organizer/events/[id] (생성 완료)

[협력업체 관리]
  → /organizer/events/[id]/partners
     ├─ 참여 신청 목록 확인
     └─ 승인 / 거절 처리

[계약 현황]
  → /organizer/events/[id]/contracts
     ├─ 상태별 필터 (대기/완료/취소)
     └─ 계약 상세 열람
```

### 2-3. 협력업체 (Partner) 플로우

```
[회원가입]
  → /signup (역할: 협력업체 선택)
  → /signup/business (사업자등록증 업로드)
  → /pending-approval (주관사 승인 대기 → 행사별)

[행사 참여]
  → /partner/events/join
     └─ 초대코드 입력 → 주관사에게 참여 요청 발송

[계약 생성]
  → /partner/events/[id]/contracts/new
     ├─ Step 1: 계약서 PDF/JPG 업로드
     ├─ Step 2: 필드 배치 (드래그 앤 드롭)
     │    ├─ 텍스트 필드
     │    ├─ 체크박스
     │    ├─ 금액 필드
     │    └─ 서명 영역
     ├─ Step 3: 미리보기 확인
     └─ Step 4: 생성 완료 → QR 코드 자동 발급

[계약 관리]
  → /partner/events/[id]/contracts/[cid]
     ├─ QR 코드 확인 / 인쇄
     ├─ 계약 상태 확인
     └─ 계약 취소 (사유 입력 필수)
```

### 2-4. 슈퍼어드민 (Super Admin) 플로우

```
[로그인]
  → /login (역할: 어드민)
  → /admin (대시보드)

[주관사 승인]
  → /admin/organizers
     ├─ 대기 중 주관사 목록
     ├─ 사업자등록증 확인
     └─ 승인 / 거절

[전체 관리]
  → /admin/users    (사용자 검색/필터/상태변경)
  → /admin/events   (전체 행사 열람)
  → /admin/contracts (전체 계약 열람)
```

---

## 3. ERD (테이블 설계)

### 3-1. 테이블 목록

```
users                  사용자 (모든 역할 공통)
organizations          업체 (주관사/협력업체)
organization_members   업체-사용자 매핑 (다중 계정)
events                 행사
event_partners         행사-협력업체 매핑
contracts              계약
contract_templates     계약서 템플릿 (PDF/이미지 원본)
contract_fields        계약서 오버레이 필드 정의
contract_field_values  고객이 입력한 필드 값
contract_signatures    전자서명 데이터
contract_histories     계약 상태 변경 이력
notifications          알림 이력
files                  파일 메타 (S3)
```

### 3-2. 상세 스키마

```sql
-- ============================================
-- users: 모든 사용자 (고객/주관사멤버/협력업체멤버/어드민)
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'organizer', 'partner', 'admin')),
    auth_provider   VARCHAR(20) NOT NULL CHECK (auth_provider IN ('kakao', 'naver', 'google', 'apple', 'email')),
    auth_provider_id VARCHAR(255),
    password_hash   VARCHAR(255),          -- email 가입 시
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'withdrawn')),
    profile_image   VARCHAR(500),
    fcm_token       VARCHAR(500),          -- 푸시 알림용
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth ON users(auth_provider, auth_provider_id);

-- ============================================
-- organizations: 업체 (주관사 / 협력업체)
-- ============================================
CREATE TABLE organizations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                    VARCHAR(20) NOT NULL CHECK (type IN ('organizer', 'partner')),
    name                    VARCHAR(200) NOT NULL,
    business_number         VARCHAR(20) NOT NULL,           -- 사업자등록번호
    business_license_file_id UUID REFERENCES files(id),     -- 사업자등록증 파일
    representative_name     VARCHAR(100),
    contact_phone           VARCHAR(20),
    contact_email           VARCHAR(255),
    address                 TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    approved_at             TIMESTAMPTZ,
    approved_by             UUID REFERENCES users(id),      -- 승인한 어드민
    rejection_reason        TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_status ON organizations(status);

-- ============================================
-- organization_members: 업체-사용자 매핑 (다중 계정 지원)
-- ============================================
CREATE TABLE organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    role            VARCHAR(20) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================
-- events: 행사
-- ============================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id    UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    venue           VARCHAR(500),                   -- 행사 장소
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_private      BOOLEAN NOT NULL DEFAULT TRUE,  -- 비공개 행사
    invite_code     VARCHAR(20) NOT NULL UNIQUE,    -- 초대코드 (자동 생성)
    commission_rate DECIMAL(5,2) DEFAULT 0.00,      -- 수수료율 (%) - 확장용
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_invite_code ON events(invite_code);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);

-- ============================================
-- event_partners: 행사-협력업체 매핑
-- ============================================
CREATE TABLE event_partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES events(id),
    partner_id      UUID NOT NULL REFERENCES organizations(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    commission_rate DECIMAL(5,2),              -- 업체별 수수료율 오버라이드
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, partner_id)
);

CREATE INDEX idx_event_partners_event ON event_partners(event_id);
CREATE INDEX idx_event_partners_partner ON event_partners(partner_id);

-- ============================================
-- contract_templates: 계약서 템플릿
-- ============================================
CREATE TABLE contract_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES events(id),
    partner_id      UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(300) NOT NULL,
    file_id         UUID NOT NULL REFERENCES files(id),     -- 원본 PDF/JPG
    file_type       VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'png')),
    page_count      INT NOT NULL DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'archived')),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_templates_event ON contract_templates(event_id);
CREATE INDEX idx_contract_templates_partner ON contract_templates(partner_id);

-- ============================================
-- contract_fields: 계약서 오버레이 필드 정의
-- ============================================
CREATE TABLE contract_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
    field_type      VARCHAR(20) NOT NULL
                    CHECK (field_type IN ('text', 'number', 'checkbox', 'amount', 'date', 'signature')),
    label           VARCHAR(200) NOT NULL,
    placeholder     VARCHAR(200),
    is_required     BOOLEAN NOT NULL DEFAULT TRUE,
    page_number     INT NOT NULL DEFAULT 1,
    position_x      DECIMAL(7,2) NOT NULL,      -- % 기반 위치 (0~100)
    position_y      DECIMAL(7,2) NOT NULL,
    width           DECIMAL(7,2) NOT NULL,
    height          DECIMAL(7,2) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    default_value   TEXT,
    validation_rule JSONB,                       -- {"min": 0, "max": 999999999} 등
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_fields_template ON contract_fields(template_id);

-- ============================================
-- contracts: 계약 (개별 계약 인스턴스)
-- ============================================
CREATE TABLE contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(30) NOT NULL UNIQUE, -- DFL-20260212-XXXX 형식
    template_id     UUID NOT NULL REFERENCES contract_templates(id),
    event_id        UUID NOT NULL REFERENCES events(id),
    partner_id      UUID NOT NULL REFERENCES organizations(id),
    customer_id     UUID REFERENCES users(id),          -- 서명 완료 시 연결
    qr_code         VARCHAR(100) NOT NULL UNIQUE,       -- QR 코드 값
    qr_code_url     VARCHAR(500),                       -- QR 이미지 URL
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                        'pending',          -- QR 발급됨, 고객 미접속
                        'in_progress',      -- 고객이 접속하여 작성 중
                        'signed',           -- 서명 완료
                        'completed',        -- PDF 생성 + 알림 발송 완료
                        'cancelled'         -- 취소됨
                    )),
    signed_pdf_file_id UUID REFERENCES files(id),       -- 서명 완료된 PDF
    total_amount    DECIMAL(15,2),                      -- 계약 금액 (확장용)
    cancelled_by    UUID REFERENCES users(id),
    cancel_reason   TEXT,
    cancelled_at    TIMESTAMPTZ,
    signed_at       TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,                        -- 계약 유효기간
    created_by      UUID NOT NULL REFERENCES users(id), -- 생성한 협력업체 직원
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_template ON contracts(template_id);
CREATE INDEX idx_contracts_event ON contracts(event_id);
CREATE INDEX idx_contracts_partner ON contracts(partner_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_qr ON contracts(qr_code);
CREATE INDEX idx_contracts_number ON contracts(contract_number);

-- ============================================
-- contract_field_values: 고객이 입력한 필드 값
-- ============================================
CREATE TABLE contract_field_values (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    field_id        UUID NOT NULL REFERENCES contract_fields(id),
    value           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(contract_id, field_id)
);

CREATE INDEX idx_field_values_contract ON contract_field_values(contract_id);

-- ============================================
-- contract_signatures: 전자서명
-- ============================================
CREATE TABLE contract_signatures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL REFERENCES contracts(id),
    signer_id       UUID NOT NULL REFERENCES users(id),     -- 고객
    signature_data  TEXT NOT NULL,                           -- Base64 서명 이미지
    signature_hash  VARCHAR(128) NOT NULL,                  -- SHA-512 무결성 해시
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    signed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signatures_contract ON contract_signatures(contract_id);

-- ============================================
-- contract_histories: 계약 상태 변경 이력
-- ============================================
CREATE TABLE contract_histories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL REFERENCES contracts(id),
    from_status     VARCHAR(20),
    to_status       VARCHAR(20) NOT NULL,
    changed_by      UUID REFERENCES users(id),
    reason          TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_histories_contract ON contract_histories(contract_id);
CREATE INDEX idx_contract_histories_created ON contract_histories(created_at);

-- ============================================
-- notifications: 알림 이력
-- ============================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    contract_id     UUID REFERENCES contracts(id),
    type            VARCHAR(20) NOT NULL
                    CHECK (type IN ('alimtalk', 'push', 'email')),
    title           VARCHAR(200),
    content         TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    metadata        JSONB,                               -- 발송 상세 정보
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_contract ON notifications(contract_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- ============================================
-- files: 파일 메타데이터 (S3)
-- ============================================
CREATE TABLE files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name   VARCHAR(500) NOT NULL,
    stored_name     VARCHAR(500) NOT NULL,
    s3_key          VARCHAR(500) NOT NULL,
    s3_bucket       VARCHAR(200) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size       BIGINT NOT NULL,
    uploaded_by     UUID REFERENCES users(id),
    purpose         VARCHAR(30) NOT NULL
                    CHECK (purpose IN (
                        'business_license',     -- 사업자등록증
                        'contract_template',    -- 계약서 원본
                        'signed_contract',      -- 서명된 계약서
                        'profile_image',        -- 프로필 이미지
                        'other'
                    )),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 확장용 테이블 (MVP 이후)
-- ============================================

-- payments: 결제 (MVP 제외, 구조만 예약)
-- CREATE TABLE payments (
--     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     contract_id     UUID NOT NULL REFERENCES contracts(id),
--     amount          DECIMAL(15,2) NOT NULL,
--     method          VARCHAR(20),
--     status          VARCHAR(20),
--     pg_transaction_id VARCHAR(100),
--     paid_at         TIMESTAMPTZ,
--     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- settlements: 정산 (MVP 제외, 구조만 예약)
-- CREATE TABLE settlements (
--     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     event_id        UUID NOT NULL REFERENCES events(id),
--     partner_id      UUID NOT NULL REFERENCES organizations(id),
--     period_start    DATE,
--     period_end      DATE,
--     total_amount    DECIMAL(15,2),
--     commission      DECIMAL(15,2),
--     net_amount      DECIMAL(15,2),
--     status          VARCHAR(20),
--     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
```

### 3-3. ERD 관계도 (텍스트)

```
users ──┬── 1:N ──→ organization_members ←── N:1 ── organizations
        │                                              │
        │                                    ┌─────────┼──────────┐
        │                                    │         │          │
        │                                  events  event_partners │
        │                                    │         │          │
        │                              ┌─────┘    (N:M 매핑)      │
        │                              │                          │
        │                     contract_templates ─────────────────┘
        │                              │
        │                     contract_fields
        │                              │
        ├── 1:N ──→ contracts ←── N:1 ─┘
        │              │
        │         ┌────┼─────────────┐
        │         │    │             │
        │  contract_   contract_     contract_
        │  field_      signatures    histories
        │  values
        │
        ├── 1:N ──→ notifications
        │
        └── 1:N ──→ files
```

---

## 4. 주요 API 엔드포인트 설계

### 4-1. 인증 (Auth)

```
POST   /api/auth/login/social          SNS 간편 로그인 (kakao/naver/google/apple)
POST   /api/auth/login/email           이메일 로그인
POST   /api/auth/signup                회원가입
POST   /api/auth/refresh               토큰 갱신
POST   /api/auth/logout                로그아웃
GET    /api/auth/me                    내 정보 조회
```

### 4-2. 사용자 (Users)

```
GET    /api/users/profile              내 프로필 조회
PATCH  /api/users/profile              프로필 수정
PATCH  /api/users/fcm-token            FCM 토큰 업데이트
```

### 4-3. 업체 (Organizations)

```
POST   /api/organizations              업체 등록 (사업자등록증 포함)
GET    /api/organizations/me           내 업체 정보
PATCH  /api/organizations/:id          업체 정보 수정
GET    /api/organizations/:id/members  업체 멤버 목록
POST   /api/organizations/:id/members  멤버 초대
DELETE /api/organizations/:id/members/:userId  멤버 제거
```

### 4-4. 행사 (Events) - 주관사

```
POST   /api/events                     행사 생성
GET    /api/events                     내 행사 목록
GET    /api/events/:id                 행사 상세
PATCH  /api/events/:id                 행사 수정
PATCH  /api/events/:id/status          행사 상태 변경
GET    /api/events/:id/partners        행사 참여 협력업체 목록
PATCH  /api/events/:id/partners/:partnerId  협력업체 승인/거절
GET    /api/events/:id/contracts       행사별 계약 현황
GET    /api/events/:id/contracts/stats 행사별 계약 통계
PATCH  /api/events/:id/settings        행사 설정 (수수료율 등)
```

### 4-5. 행사 참여 (Event Partners) - 협력업체

```
POST   /api/event-partners/join        초대코드로 행사 참여 신청
GET    /api/event-partners/my-events   내 참여 행사 목록
GET    /api/event-partners/:eventId    참여 행사 상세
```

### 4-6. 계약 템플릿 (Contract Templates)

```
POST   /api/contract-templates                  템플릿 생성 (PDF/JPG 업로드)
GET    /api/contract-templates?eventId=xxx       행사별 템플릿 목록
GET    /api/contract-templates/:id               템플릿 상세
DELETE /api/contract-templates/:id               템플릿 삭제
POST   /api/contract-templates/:id/fields        필드 배치 저장 (일괄)
GET    /api/contract-templates/:id/fields        필드 목록 조회
```

### 4-7. 계약 (Contracts) - 협력업체

```
POST   /api/contracts                   계약 생성 (QR 자동 발급)
GET    /api/contracts?eventId=xxx       행사별 계약 목록
GET    /api/contracts/:id               계약 상세
POST   /api/contracts/:id/cancel        계약 취소 (사유 필수)
GET    /api/contracts/:id/qr            QR 코드 조회
GET    /api/contracts/:id/history       계약 상태 변경 이력
```

### 4-8. 계약 진행 (Contract Flow) - 고객

```
GET    /api/contract-flow/:qrCode       QR 코드로 계약 정보 조회
POST   /api/contract-flow/:qrCode/start 계약 작성 시작 (상태: in_progress)
POST   /api/contract-flow/:qrCode/fill  필드 값 저장 (임시저장 가능)
POST   /api/contract-flow/:qrCode/sign  전자서명 제출
GET    /api/contract-flow/:qrCode/pdf   서명된 PDF 다운로드
```

### 4-9. 고객 (Customer)

```
GET    /api/customer/contracts          내 계약 목록
GET    /api/customer/contracts/:id      계약 상세
GET    /api/customer/contracts/:id/pdf  계약서 PDF 다운로드
```

### 4-10. 슈퍼어드민 (Admin)

```
GET    /api/admin/dashboard             대시보드 통계
GET    /api/admin/organizers            주관사 목록 (필터/페이지네이션)
PATCH  /api/admin/organizers/:id/approve   주관사 승인
PATCH  /api/admin/organizers/:id/reject    주관사 거절
GET    /api/admin/users                 전체 사용자 목록
PATCH  /api/admin/users/:id/status      사용자 상태 변경
GET    /api/admin/events                전체 행사 목록
GET    /api/admin/events/:id            행사 상세
GET    /api/admin/contracts             전체 계약 목록
GET    /api/admin/contracts/:id         계약 상세
```

### 4-11. 파일 업로드

```
POST   /api/files/upload                파일 업로드 (S3 presigned URL)
POST   /api/files/upload/presigned      Presigned URL 발급
GET    /api/files/:id                   파일 메타 조회
GET    /api/files/:id/download          파일 다운로드 URL
```

### 4-12. 알림

```
GET    /api/notifications               내 알림 목록
PATCH  /api/notifications/:id/read      알림 읽음 처리
```

---

## 5. 어드민 페이지 구조

```
/admin
├── 대시보드
│   ├── 전체 주관사 수 (승인대기 / 활성)
│   ├── 전체 행사 수 (진행 중 / 종료)
│   ├── 전체 계약 수 (완료 / 진행 중 / 취소)
│   ├── 전체 사용자 수 (역할별)
│   └── 최근 활동 로그
│
├── 주관사 관리 (/admin/organizers)
│   ├── 목록 (상태 필터: 대기/승인/거절/정지)
│   ├── 검색 (업체명, 사업자번호)
│   └── 상세
│       ├── 업체 정보 + 사업자등록증 뷰어
│       ├── 승인 / 거절 (거절 사유 입력)
│       ├── 소속 멤버 목록
│       └── 해당 주관사의 행사 목록
│
├── 사용자 관리 (/admin/users)
│   ├── 목록 (역할 필터, 상태 필터)
│   ├── 검색 (이름, 이메일, 전화번호)
│   └── 상세
│       ├── 기본 정보
│       ├── 소속 업체
│       ├── 계약 이력
│       └── 상태 변경 (활성/정지/탈퇴처리)
│
├── 행사 관리 (/admin/events)
│   ├── 목록 (상태 필터, 날짜 필터)
│   ├── 검색 (행사명, 주관사명)
│   └── 상세
│       ├── 행사 정보
│       ├── 참여 협력업체 목록
│       └── 계약 현황 요약
│
└── 계약 관리 (/admin/contracts)
    ├── 목록 (상태 필터, 날짜 필터)
    ├── 검색 (계약번호, 고객명, 업체명)
    └── 상세
        ├── 계약 정보 전체
        ├── 서명된 PDF 뷰어
        ├── 상태 변경 이력
        └── 알림 발송 이력
```

---

## 6. 프론트엔드 폴더 구조 (Next.js App Router)

```
frontend/
├── public/
│   ├── favicon.ico
│   └── images/
│
├── src/
│   ├── app/                                    # App Router
│   │   ├── layout.tsx                          # 루트 레이아웃
│   │   ├── page.tsx                            # 랜딩 페이지
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                             # 인증 그룹
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── signup/business/page.tsx
│   │   │   └── pending-approval/page.tsx
│   │   │
│   │   ├── (customer)/                         # 고객
│   │   │   ├── layout.tsx
│   │   │   ├── customer/page.tsx               # 고객 홈
│   │   │   ├── customer/contracts/page.tsx
│   │   │   ├── customer/contracts/[id]/page.tsx
│   │   │   └── customer/profile/page.tsx
│   │   │
│   │   ├── (organizer)/                        # 주관사
│   │   │   ├── layout.tsx
│   │   │   ├── organizer/page.tsx              # 대시보드
│   │   │   ├── organizer/events/page.tsx
│   │   │   ├── organizer/events/new/page.tsx
│   │   │   ├── organizer/events/[id]/page.tsx
│   │   │   ├── organizer/events/[id]/partners/page.tsx
│   │   │   ├── organizer/events/[id]/contracts/page.tsx
│   │   │   ├── organizer/events/[id]/settings/page.tsx
│   │   │   └── organizer/profile/page.tsx
│   │   │
│   │   ├── (partner)/                          # 협력업체
│   │   │   ├── layout.tsx
│   │   │   ├── partner/page.tsx                # 대시보드
│   │   │   ├── partner/events/page.tsx
│   │   │   ├── partner/events/join/page.tsx
│   │   │   ├── partner/events/[id]/page.tsx
│   │   │   ├── partner/events/[id]/contracts/page.tsx
│   │   │   ├── partner/events/[id]/contracts/new/page.tsx
│   │   │   ├── partner/events/[id]/contracts/[cid]/page.tsx
│   │   │   └── partner/profile/page.tsx
│   │   │
│   │   ├── (admin)/                            # 슈퍼어드민
│   │   │   ├── layout.tsx
│   │   │   ├── admin/page.tsx                  # 대시보드
│   │   │   ├── admin/organizers/page.tsx
│   │   │   ├── admin/organizers/[id]/page.tsx
│   │   │   ├── admin/users/page.tsx
│   │   │   ├── admin/users/[id]/page.tsx
│   │   │   ├── admin/events/page.tsx
│   │   │   ├── admin/events/[id]/page.tsx
│   │   │   ├── admin/contracts/page.tsx
│   │   │   └── admin/contracts/[id]/page.tsx
│   │   │
│   │   ├── contract/                           # 계약 플로우 (QR 진입)
│   │   │   └── [code]/
│   │   │       ├── page.tsx                    # 진입점
│   │   │       ├── login/page.tsx
│   │   │       ├── view/page.tsx
│   │   │       ├── sign/page.tsx
│   │   │       └── complete/page.tsx
│   │   │
│   │   └── api/                                # API Routes (BFF)
│   │       └── auth/
│   │           └── [...nextauth]/route.ts
│   │
│   ├── components/                             # 공통 컴포넌트
│   │   ├── ui/                                 # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── DateRangePicker.tsx
│   │   │
│   │   ├── layout/                             # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx                   # 모바일 하단 네비
│   │   │   └── PageHeader.tsx
│   │   │
│   │   ├── contract/                           # 계약 관련
│   │   │   ├── ContractViewer.tsx              # PDF/이미지 뷰어
│   │   │   ├── FieldOverlay.tsx                # 필드 오버레이 렌더러
│   │   │   ├── FieldEditor.tsx                 # 필드 배치 에디터 (드래그앤드롭)
│   │   │   ├── SignaturePad.tsx                # 전자서명 패드
│   │   │   └── QRCodeDisplay.tsx               # QR 코드 표시
│   │   │
│   │   ├── event/                              # 행사 관련
│   │   │   ├── EventCard.tsx
│   │   │   └── EventStatusBadge.tsx
│   │   │
│   │   └── common/                             # 공통
│   │       ├── FileUpload.tsx
│   │       ├── BusinessLicenseUpload.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/                                  # 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useContract.ts
│   │   ├── useEvent.ts
│   │   ├── useFileUpload.ts
│   │   ├── useNotification.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── lib/                                    # 유틸리티
│   │   ├── api.ts                              # API 클라이언트 (axios 인스턴스)
│   │   ├── auth.ts                             # 인증 유틸
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── validators.ts
│   │
│   ├── stores/                                 # 상태 관리 (Zustand)
│   │   ├── authStore.ts
│   │   ├── contractStore.ts
│   │   └── notificationStore.ts
│   │
│   └── types/                                  # TypeScript 타입
│       ├── user.ts
│       ├── organization.ts
│       ├── event.ts
│       ├── contract.ts
│       ├── notification.ts
│       └── api.ts
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. 백엔드 NestJS 모듈 구조

```
backend/
├── src/
│   ├── main.ts                                 # 엔트리포인트
│   ├── app.module.ts                           # 루트 모듈
│   │
│   ├── common/                                 # 공통 모듈
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts              # @Roles('admin', 'organizer')
│   │   │   ├── current-user.decorator.ts       # @CurrentUser()
│   │   │   └── public.decorator.ts             # @Public()
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── organization-access.guard.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts        # 응답 포맷 통일
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   └── utils/
│   │       ├── code-generator.ts               # 초대코드, 계약번호 생성
│   │       └── hash.ts
│   │
│   ├── config/                                 # 설정
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── s3.config.ts
│   │   └── notification.config.ts
│   │
│   ├── database/                               # DB
│   │   ├── database.module.ts
│   │   ├── migrations/                         # TypeORM 마이그레이션
│   │   └── seeds/                              # 시드 데이터
│   │       └── admin.seed.ts
│   │
│   ├── modules/
│   │   ├── auth/                               # 인증 모듈
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── kakao.strategy.ts
│   │   │   │   ├── naver.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── signup.dto.ts
│   │   │       └── token.dto.ts
│   │   │
│   │   ├── users/                              # 사용자 모듈
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       ├── update-profile.dto.ts
│   │   │       └── user-response.dto.ts
│   │   │
│   │   ├── organizations/                      # 업체 모듈
│   │   │   ├── organizations.module.ts
│   │   │   ├── organizations.controller.ts
│   │   │   ├── organizations.service.ts
│   │   │   ├── organizations.repository.ts
│   │   │   ├── entities/
│   │   │   │   ├── organization.entity.ts
│   │   │   │   └── organization-member.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-organization.dto.ts
│   │   │       └── update-organization.dto.ts
│   │   │
│   │   ├── events/                             # 행사 모듈
│   │   │   ├── events.module.ts
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── events.repository.ts
│   │   │   ├── entities/
│   │   │   │   ├── event.entity.ts
│   │   │   │   └── event-partner.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-event.dto.ts
│   │   │       ├── update-event.dto.ts
│   │   │       └── join-event.dto.ts
│   │   │
│   │   ├── contracts/                          # 계약 모듈 (핵심)
│   │   │   ├── contracts.module.ts
│   │   │   ├── contracts.controller.ts         # 협력업체 계약 관리
│   │   │   ├── contract-flow.controller.ts     # 고객 계약 플로우
│   │   │   ├── contracts.service.ts
│   │   │   ├── contract-flow.service.ts
│   │   │   ├── contracts.repository.ts
│   │   │   ├── entities/
│   │   │   │   ├── contract.entity.ts
│   │   │   │   ├── contract-template.entity.ts
│   │   │   │   ├── contract-field.entity.ts
│   │   │   │   ├── contract-field-value.entity.ts
│   │   │   │   ├── contract-signature.entity.ts
│   │   │   │   └── contract-history.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-template.dto.ts
│   │   │       ├── create-contract.dto.ts
│   │   │       ├── field-layout.dto.ts
│   │   │       ├── fill-fields.dto.ts
│   │   │       ├── sign-contract.dto.ts
│   │   │       └── cancel-contract.dto.ts
│   │   │
│   │   ├── admin/                              # 어드민 모듈
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   │       ├── approve-org.dto.ts
│   │   │       └── dashboard.dto.ts
│   │   │
│   │   ├── files/                              # 파일 모듈
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   ├── entities/
│   │   │   │   └── file.entity.ts
│   │   │   └── dto/
│   │   │       └── upload-file.dto.ts
│   │   │
│   │   ├── notifications/                      # 알림 모듈
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── kakao-alimtalk.provider.ts
│   │   │   │   ├── fcm.provider.ts
│   │   │   │   └── email.provider.ts
│   │   │   ├── entities/
│   │   │   │   └── notification.entity.ts
│   │   │   └── templates/                      # 알림 메시지 템플릿
│   │   │       ├── contract-complete.ts
│   │   │       └── contract-cancel.ts
│   │   │
│   │   ├── pdf/                                # PDF 생성 모듈
│   │   │   ├── pdf.module.ts
│   │   │   └── pdf.service.ts                  # 서명 PDF 합성
│   │   │
│   │   └── qr/                                 # QR 코드 모듈
│   │       ├── qr.module.ts
│   │       └── qr.service.ts
│   │
│   └── shared/                                 # 공유 모듈
│       └── s3/
│           ├── s3.module.ts
│           └── s3.service.ts
│
├── test/
│   ├── e2e/
│   └── unit/
│
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── ormconfig.ts
└── package.json
```

---

## 8. 계약 + QR + 서명 시퀀스 플로우

### 8-1. 계약 생성 (협력업체)

```
협력업체                     서버                        S3
  │                          │                          │
  ├─ 계약서 PDF 업로드 ──────→│                          │
  │                          ├─ Presigned URL 발급 ────→│
  │                          │←── URL 반환 ─────────────┤
  │←── URL 반환 ─────────────┤                          │
  ├─ 파일 직접 업로드 ────────────────────────────────────→│
  │                          │                          │
  ├─ 업로드 완료 알림 ───────→│                          │
  │                          ├─ files 테이블 레코드 생성  │
  │                          ├─ contract_templates 생성  │
  │                          │                          │
  ├─ 필드 배치 정보 전송 ────→│                          │
  │  (x, y, width, height,  │                          │
  │   type, label 배열)      ├─ contract_fields 일괄 저장│
  │                          │                          │
  ├─ "계약 생성" 요청 ───────→│                          │
  │                          ├─ contract 레코드 생성     │
  │                          ├─ 계약번호 자동 생성        │
  │                          │  (DFL-YYYYMMDD-XXXX)     │
  │                          ├─ QR 코드 생성             │
  │                          │  (내용: https://domain    │
  │                          │   /contract/{code})       │
  │                          ├─ QR 이미지 → S3 ─────────→│
  │                          ├─ contract_histories 기록  │
  │←── QR 코드 + 계약정보 ───┤                          │
  │                          │                          │
```

### 8-2. 고객 계약 서명 플로우

```
고객                        서버                   S3          알림서비스
 │                          │                      │              │
 ├─ QR 스캔 ───────────────→│                      │              │
 │  GET /contract-flow/:qr  │                      │              │
 │                          ├─ 계약 유효성 확인     │              │
 │                          │  (상태, 만료일 등)    │              │
 │←── 계약 기본정보 반환 ────┤                      │              │
 │                          │                      │              │
 ├─ [미로그인 시]            │                      │              │
 ├─ SNS 로그인 ────────────→│                      │              │
 │                          ├─ OAuth 처리           │              │
 │                          ├─ JWT 발급             │              │
 │←── 토큰 반환 ────────────┤                      │              │
 │                          │                      │              │
 ├─ 계약 작성 시작 ─────────→│                      │              │
 │  POST .../start           ├─ 상태 → in_progress │              │
 │                          ├─ customer_id 연결     │              │
 │                          ├─ history 기록         │              │
 │←── 템플릿+필드 정보 반환 ─┤                      │              │
 │                          │                      │              │
 │  [계약서 PDF/이미지 로드]  │                      │              │
 │  [오버레이 필드에 값 입력]  │                      │              │
 │                          │                      │              │
 ├─ 필드 값 저장 ───────────→│                      │              │
 │  POST .../fill            ├─ field_values 저장   │              │
 │                          │  (임시저장 가능)      │              │
 │                          │                      │              │
 ├─ "동의합니다" 체크 확인   │                      │              │
 │                          │                      │              │
 ├─ 전자서명 제출 ──────────→│                      │              │
 │  POST .../sign            │                      │              │
 │  (signature_data:base64) │                      │              │
 │                          ├─ 서명 데이터 검증     │              │
 │                          ├─ signature_hash 생성  │              │
 │                          │  (SHA-512)            │              │
 │                          ├─ contract_signatures  │              │
 │                          │  레코드 생성          │              │
 │                          ├─ 상태 → signed        │              │
 │                          │                      │              │
 │                          ├─ [PDF 합성 시작]      │              │
 │                          │  원본 PDF             │              │
 │                          │  + 필드 값 렌더링     │              │
 │                          │  + 서명 이미지 합성   │              │
 │                          │  = 최종 서명 PDF      │              │
 │                          ├─ 서명 PDF → S3 ──────→│              │
 │                          │                      │              │
 │                          ├─ 상태 → completed     │              │
 │                          ├─ history 기록         │              │
 │                          │                      │              │
 │                          ├─ 알림 발송 요청 ──────────────────────→│
 │                          │                      │   카카오 알림톡│
 │                          │                      │   FCM 푸시    │
 │                          │                      │   이메일      │
 │                          │                      │              │
 │←── 완료 응답 ────────────┤                      │              │
 │                          │                      │              │
 │  [완료 화면 표시]          │                      │              │
 │  - "계약이 완료되었습니다" │                      │              │
 │  - CTA: "내 계약 보기"    │                      │              │
 │  - CTA: "PDF 다운로드"    │                      │              │
 │                          │                      │              │
```

### 8-3. 계약 취소 플로우

```
협력업체                    서버
 │                          │
 ├─ 계약 취소 요청 ─────────→│
 │  POST /contracts/:id/    │
 │    cancel                │
 │  { reason: "..." }       │
 │                          ├─ 권한 확인 (해당 협력업체인지)
 │                          ├─ 상태 확인 (취소 가능한 상태인지)
 │                          ├─ 상태 → cancelled
 │                          ├─ cancel_reason, cancelled_by 기록
 │                          ├─ contract_histories 기록
 │                          ├─ 고객에게 취소 알림 발송
 │                          │  (알림톡 + 푸시 + 이메일)
 │←── 취소 완료 응답 ────────┤
 │                          │
```

---

## 9. MVP 기준 개발 우선순위

### Phase 1: 기반 인프라 (1~2주)

| 순위 | 항목 | 설명 |
|------|------|------|
| 1-1 | 프로젝트 초기 세팅 | Next.js + NestJS + PostgreSQL + Docker Compose |
| 1-2 | DB 스키마 + 마이그레이션 | 전체 테이블 생성, 시드 데이터 (어드민 계정) |
| 1-3 | 인증 시스템 | OAuth (카카오 우선) + JWT + 역할 기반 가드 |
| 1-4 | 파일 업로드 | S3 Presigned URL 방식 + files 테이블 |
| 1-5 | 공통 UI 컴포넌트 | Button, Input, Card, Modal, Table, Toast 등 |
| 1-6 | 레이아웃 시스템 | 역할별 레이아웃 (Header, Sidebar, BottomNav) |

### Phase 2: 업체 + 행사 (1~2주)

| 순위 | 항목 | 설명 |
|------|------|------|
| 2-1 | 회원가입 + 역할 선택 | 역할 선택 UI + 사업자등록증 업로드 |
| 2-2 | 어드민: 주관사 승인 | 주관사 목록 + 승인/거절 기능 |
| 2-3 | 주관사: 행사 생성 | 행사 CRUD + 초대코드 자동 생성 |
| 2-4 | 협력업체: 행사 참여 | 초대코드 입력 → 참여 신청 |
| 2-5 | 주관사: 협력업체 승인 | 참여 신청 목록 + 승인/거절 |

### Phase 3: 계약 핵심 (2~3주) - 가장 중요

| 순위 | 항목 | 설명 |
|------|------|------|
| 3-1 | 계약서 업로드 + 뷰어 | PDF/JPG 업로드 → 뷰어에서 표시 |
| 3-2 | 필드 오버레이 에디터 | 드래그앤드롭으로 필드 배치 (텍스트/체크/금액/서명) |
| 3-3 | QR 코드 생성 | 계약 생성 시 QR 자동 발급 + 표시/인쇄 |
| 3-4 | 고객 계약 플로우 | QR 스캔 → 로그인 → 내용확인 → 필드입력 → 동의 |
| 3-5 | 전자서명 | 터치/마우스 서명 패드 구현 |
| 3-6 | 서명 PDF 합성 | 원본 + 필드값 + 서명 → 최종 PDF 생성 → S3 |
| 3-7 | 계약 상태 관리 | 상태 머신 + 이력 기록 |
| 3-8 | 계약 취소 | 협력업체 취소 + 사유 입력 |

### Phase 4: 알림 + 마이페이지 (1주)

| 순위 | 항목 | 설명 |
|------|------|------|
| 4-1 | 카카오 알림톡 연동 | 계약 완료/취소 시 알림톡 발송 |
| 4-2 | FCM 푸시 연동 | 앱 푸시 알림 |
| 4-3 | 이메일 발송 | 계약 완료 이메일 (PDF 첨부 또는 링크) |
| 4-4 | 고객 마이페이지 | 내 계약 목록 + PDF 다운로드 |

### Phase 5: 관리 기능 보강 (1주)

| 순위 | 항목 | 설명 |
|------|------|------|
| 5-1 | 주관사: 계약 현황 | 행사별 계약 현황 대시보드 |
| 5-2 | 협력업체: 계약 관리 | 계약 목록 + 상태 관리 |
| 5-3 | 어드민 대시보드 | 전체 통계 + 관리 기능 |
| 5-4 | 어드민: 사용자/행사/계약 관리 | 전체 데이터 열람 + 관리 |

### Phase 6: 폴리싱 (1주)

| 순위 | 항목 | 설명 |
|------|------|------|
| 6-1 | 반응형 UI | 모바일 최적화 (특히 계약 플로우) |
| 6-2 | 에러 핸들링 | 전체 에러 처리 + 사용자 안내 |
| 6-3 | 로딩/스켈레톤 | UX 개선 |
| 6-4 | 보안 점검 | XSS, CSRF, 권한 체크 전수 검사 |

---

**총 예상 MVP 범위: 약 7~10주 (개발자 2~3명 기준)**

### 핵심 외부 라이브러리

| 용도 | 프론트엔드 | 백엔드 |
|------|-----------|--------|
| 상태관리 | Zustand | - |
| HTTP | Axios (+ React Query) | - |
| PDF 뷰어 | react-pdf (pdfjs) | - |
| 서명 패드 | react-signature-canvas | - |
| 드래그앤드롭 | @dnd-kit/core | - |
| QR 코드 | qrcode.react (표시) | qrcode (생성) |
| PDF 합성 | - | pdf-lib |
| ORM | - | TypeORM |
| 인증 | next-auth | @nestjs/passport |
| 파일 | - | @aws-sdk/client-s3 |
| 알림톡 | - | kakao-alimtalk SDK |
| 푸시 | - | firebase-admin (FCM) |
| 이메일 | - | @nestjs-modules/mailer |
| CSS | Tailwind CSS | - |

---

*이 문서는 DealFlow MVP의 전체 설계를 담고 있으며, 실제 개발 착수를 위한 기준 문서입니다.*
