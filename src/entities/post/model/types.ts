export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_CATEGORIES = [
  "전체",
  "일상",
  "기술",
  "여행",
  "리뷰",
  "기타",
] as const;

export type Category = (typeof DEFAULT_CATEGORIES)[number];
