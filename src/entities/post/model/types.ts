export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isEdited?: boolean;
}

export const DEFAULT_CATEGORIES = [
  "ALL",
  "NOTICE",
  "FREE",
  "QNA",
  "ETC",
] as const;

export type Category = (typeof DEFAULT_CATEGORIES)[number];
