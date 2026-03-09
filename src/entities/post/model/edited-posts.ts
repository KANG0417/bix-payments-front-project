const EDITED_POST_IDS_KEY = "edited_ids";

/** localStorage의 수정 게시글 id 목록 조회/숫자 배열 정규화 */
function readEditedIds() {
  // SSR 환경: window/localStorage 접근 불가 -> 빈 배열 반환
  if (typeof window === "undefined") return [] as number[];

  try {
    const raw = window.localStorage.getItem(EDITED_POST_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  } catch {
    // 저장값 손상/JSON parse 실패/스토리지 접근 제한 -> 빈 배열 처리
    return [];
  }
}

/** 수정 게시글 id 목록 localStorage 저장 */
function writeEditedIds(ids: number[]) {
  // SSR 환경: window/localStorage 접근 불가 -> 저장 생략
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(EDITED_POST_IDS_KEY, JSON.stringify(ids));
  } catch {
    // private mode/권한 제한/용량 초과 등 저장 실패 -> 기능 영향 낮아 무시
  }
}

/** 게시글 id 로컬 수정 목록 추가 */
export function markLocallyEditedPost(postId: number) {
  if (!Number.isFinite(postId) || postId <= 0) return;

  const ids = readEditedIds();
  if (!ids.includes(postId)) {
    ids.push(postId);
    writeEditedIds(ids);
  }
}

/** 게시글 id 로컬 수정 목록 포함 여부 확인 */
export function isLocallyEditedPost(postId: number) {
  if (!Number.isFinite(postId) || postId <= 0) return false;
  return readEditedIds().includes(postId);
}
