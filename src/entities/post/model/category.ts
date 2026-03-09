export type BoardCategory = "ALL" | "NOTICE" | "FREE" | "QNA" | "ETC";

export const CATEGORIES: { label: string; value: BoardCategory }[] = [
  { label: "전체", value: "ALL" },
  { label: "공지", value: "NOTICE" },
  { label: "자유", value: "FREE" },
  { label: "질문", value: "QNA" },
  { label: "기타", value: "ETC" },
];

/** 글쓰기 폼에서 사용하는 카테고리 목록 (`전체` 제외) */
export const WRITE_CATEGORIES = CATEGORIES.filter((c) => c.label !== "전체");

/** 한글 라벨/API 값을 `BoardCategory`로 정규화 */
export const normalizeCategory = (value: unknown): BoardCategory => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();

  if (raw === "ALL" || raw === "전체") return "ALL";
  if (raw === "NOTICE" || raw === "공지") return "NOTICE";
  if (raw === "FREE" || raw === "자유") return "FREE";
  if (raw === "QNA" || raw === "질문") return "QNA";
  if (raw === "ETC" || raw === "기타") return "ETC";

  return "ETC";
};

/** UI 라벨을 API 카테고리 값으로 변환 */
export const labelToCategory = (label: string): BoardCategory =>
  normalizeCategory(label);

/** API 카테고리 값을 UI 라벨로 변환 */
export const categoryToLabel = (value: unknown): string =>
  CATEGORIES.find((c) => c.value === normalizeCategory(value))?.label ?? "기타";
