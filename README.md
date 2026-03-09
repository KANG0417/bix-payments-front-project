# 💳 BIX Payments Front Project

Next.js 기반 게시판 프론트엔드 프로젝트입니다.  
회원가입/로그인, JWT 인증, 게시글 CRUD, 상세 화면 UX 개선을 구현했습니다.

---

## 📅 프로젝트 일정

| 항목 | 날짜 |
|------|------|
| 시작일 | 2025년 3월 4일 |
| 마감일 | 2025년 3월 10일 |
| 개발 기간 | 총 7일 |

- 주말 집중 구현: 회원가입/로그인 + 게시글 CRUD
- 3월 10일 기준 마무리 및 정리

---

## 🛠️ 기술 스택

`bun.lock` 기준 실제 사용 라이브러리:

- Framework: Next.js 16, React 19, React DOM 19
- Data Fetching: Axios, TanStack Query
- State: Zustand
- Styling: Tailwind CSS 4
- Language/Tooling: TypeScript, ESLint
- Utility: es-hangul
- Package Manager: Bun
- AI Assistant: Cursor Agent (구현/리팩터링 보조)

---

## 🧩 주요 기능

- 회원가입 / 로그인 / 로그아웃
- JWT 인증 기반 게시글 조회/작성/수정/삭제
- 게시글 상세(이전/다음 글, 첨부파일 다운로드, 수정/삭제 제어)
- 공통 컴포넌트(모달/레이아웃 등) 재사용 구조

---

## 🚀 시작하기

### 0) Bun 설치 및 PATH 확인

`bun` 명령어가 인식되지 않으면 설치/환경변수(PATH) 설정이 먼저 필요합니다.

```bash
# Bun 설치 (Windows PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Bun 설치 (macOS / zsh, bash)
curl -fsSL https://bun.sh/install | bash

# Bun 버전 확인 (명령어 인식 확인)
bun --version
```

Windows에서 `bun --version`이 안 되면:
- 시스템 환경 변수 `Path`에 `C:\Users\<사용자명>\.bun\bin` 추가
- 터미널/IDE 완전 재시작 후 다시 확인

macOS에서 `bun --version`이 안 되면:
- `~/.zshrc` 또는 `~/.bashrc`에 아래 내용 추가

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

- `source ~/.zshrc` (또는 `source ~/.bashrc`) 실행 후 재확인

```bash
# 1) 패키지 설치
bun install

# 2) 환경변수 파일 생성
cp .env.example .env

# 3) 개발 서버 실행
bun run dev
```

### 환경변수 안내

- 실제 API 주소 값은 private 정보라 저장소에 하드코딩하지 않습니다.
- `.env` 값은 메일 답장에 첨부합니다.

---

## ✅ 구현 중점

### 1) JWT + Refresh Token 자동 갱신 흐름

- API 요청은 공통 axios 클라이언트에서 처리
- Access Token 만료(401) 시 refresh 요청 후 원요청 재시도
- 토큰 갱신 실패 시 세션 만료 상태로 전환해 무한 재요청 방지

### 2) `수정됨` 표시 UX (낙관적 업데이트 + 로컬 유지)

- 수정 완료 시점에 로컬 상태를 먼저 갱신해 즉시 `수정됨` 표시
- 서버 반영 지연이 있어도 사용자가 먼저 결과를 확인 가능
- `localStorage`에 수정된 게시글 id를 저장해 새로고침 후에도 표시 유지

### 3) 계정 전환 시 데이터 캐시 분리

- 문제: 로그아웃 후 다른 계정 로그인 시 이전 계정 게시글이 잠시 보이는 현상
- 원인: React Query 캐시가 세션 전환 시 유지
- 해결: 로그인 성공/로그아웃 시점에 `queryClient.clear()` 실행으로 캐시 초기화

---

## 🏗️ 구조/품질 기준

- FSD(Feature-Sliced Design) 기반 폴더 구조로 탐색/유지보수 용이성 강화
- `AuthGuard` 기반 보호 라우트 접근 제어(비로그인 시 `signin` 리다이렉트)
- 반응형 대응: 화면 크기별 레이아웃/네비게이션 동작 분리(모바일 패널, 데스크톱 드롭다운)
- 시맨틱 태그(`header`, `nav`, `main`, `section`, `footer`) 중심 마크업
- 재활용 가능한 UI는 공통 컴포넌트로 분리해 중복 최소화
