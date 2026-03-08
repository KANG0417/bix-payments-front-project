export type BoardCategory = "NOTICE" | "FREE" | "QNA" | "ETC";

export const CATEGORIES: { label: string; value: BoardCategory }[] = [
  { label: "전체", value: "FREE" },
  { label: "공지", value: "NOTICE" },
  { label: "자유", value: "FREE" },
  { label: "질문", value: "QNA" },
  { label: "기타", value: "ETC" },
];

/** 글쓰기 폼용 (전체 제외) */
export const WRITE_CATEGORIES = CATEGORIES.filter((c) => c.label !== "전체");

/** UI label → API enum */
export const labelToCategory = (label: string): BoardCategory =>
  CATEGORIES.find((c) => c.label === label)?.value ?? "FREE";

/** API enum → UI label */
export const categoryToLabel = (value: BoardCategory): string =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value;
