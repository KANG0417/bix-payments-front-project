# 401 처리 복습 메모

## 왜 401이 떴는가
- `/boards`는 인증 API가 아니라서 JWT 필요
- 토큰 만료/비정상 토큰(`Bearer Bearer ...`)이면 401 발생
- 하이드레이션/초기 진입 타이밍에 토큰 없는 요청이 먼저 나가면 401 발생 가능

## 이번에 적용한 처리
- `AuthGuard`에서 토큰 유효성 검사(exp 포함) 후 보호 라우트 접근 허용
- 토큰 없거나 만료면 `logout()` + 로그인 페이지 이동
- `/boards` 요청 전에 토큰 정규화(`Bearer ` 접두 제거) 및 만료 검사
- 401 응답 시 세션 정리 후 재로그인 유도
- 카운트/목록 조회 모두 토큰이 있을 때만 실행(`enabled`)

## 변경 파일
- `src/widgets/auth/AuthGuard/AuthGuard.tsx`
- `src/features/auth/api/useBoard.ts`
- `src/entities/user/model/auth-store.ts`
- `src/features/post/api/board.ts`

## 복습 체크리스트
- [ ] 로그인 직후 `/boards?page=0&size=1`가 200인지 확인
- [ ] 토큰 만료 상태에서 보호 페이지 진입 시 로그인으로 리다이렉트 되는지 확인
- [ ] 토큰 값이 `Bearer` 중복 없이 저장되는지 확인
- [ ] 카테고리 전환 시 401 없이 목록이 바뀌는지 확인
