import { useQuery } from "@tanstack/react-query";
import type { BoardCategory } from "@entities/post/model/category";

const BASE_URL = "https://front-mission.bigs.or.kr";

export interface BoardItem {
  id: number;
  title: string;
  content: string;
  category: BoardCategory;
  createdAt: string;
  updatedAt: string;
}

export interface BoardsResponse {
  content: BoardItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface FetchBoardsParams {
  category?: BoardCategory | "ALL";
  page?: number;
  size?: number;
}

async function fetchBoards({
  category,
  page = 0,
  size = 10,
}: FetchBoardsParams): Promise<BoardsResponse> {
  const params = new URLSearchParams();
  if (category && category !== "ALL") params.set("category", category);
  params.set("page", String(page));
  params.set("size", String(size));

  const res = await fetch(`${BASE_URL}/boards?${params.toString()}`);
  if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
  return res.json();
}

export function useBoards({
  category,
  page = 0,
  size = 10,
}: FetchBoardsParams = {}) {
  return useQuery({
    queryKey: ["boards", category, page, size],
    queryFn: () => fetchBoards({ category, page, size }),
  });
}

/** 카테고리별 게시글 수 */
export function useBoardCount(category?: BoardCategory | "ALL") {
  const { data } = useBoards({ category, size: 1 });
  return data?.totalElements ?? 0;
}
