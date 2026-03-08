import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { BoardCategory } from "@entities/post/model/category";
import { useAuthStore } from "@entities/user/model/auth-store";

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
  accessToken?: string;
}

interface BoardCountMap {
  ALL: number;
  NOTICE: number;
  FREE: number;
  QNA: number;
  ETC: number;
}

function normalizeAccessToken(token?: string | null) {
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, "").trim();
}

export function hasToken(token: string | null) {
  return !!normalizeAccessToken(token);
}

async function fetchBoards({
  category,
  page = 0,
  size = 10,
  accessToken,
}: FetchBoardsParams): Promise<BoardsResponse> {
  const params = new URLSearchParams();
  if (category && category !== "ALL") params.set("category", category);
  params.set("page", String(page));
  params.set("size", String(size));

  const normalizedToken = normalizeAccessToken(accessToken);
  if (!normalizedToken) throw new Error("로그인이 필요합니다.");

  const res = await fetch(`${BASE_URL}/boards?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${normalizedToken}`,
    },
  });

  if (res.status === 401) {
    useAuthStore.getState().setSessionExpired(true);
    throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
  }
  if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
  return res.json();
}

async function fetchBoardCountMap(accessToken: string): Promise<BoardCountMap> {
  const countMap: BoardCountMap = {
    ALL: 0,
    NOTICE: 0,
    FREE: 0,
    QNA: 0,
    ETC: 0,
  };

  const first = await fetchBoards({ page: 0, size: 50, accessToken });
  const totalPages = Number(first.totalPages ?? 1);

  const collect = (items: BoardItem[]) => {
    countMap.ALL += items.length;
    items.forEach((item) => {
      const key = item.category as keyof BoardCountMap;
      if (key in countMap) countMap[key] += 1;
    });
  };

  collect(first.content);

  for (let page = 1; page < totalPages; page += 1) {
    const next = await fetchBoards({ page, size: 50, accessToken });
    collect(next.content);
  }

  return countMap;
}

export function useBoards({
  category,
  page = 0,
  size = 10,
}: FetchBoardsParams = {}) {
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = normalizeAccessToken(rawAccessToken);
  const enabled = isHydrated && hasToken(accessToken);

  return useQuery({
    queryKey: ["boards", category, page, size, accessToken],
    queryFn: () =>
      fetchBoards({
        category,
        page,
        size,
        accessToken: accessToken,
      }),
    enabled,
  });
}

interface UseInfiniteBoardsParams {
  category?: BoardCategory | "ALL";
  size?: number;
}

/** 게시글 무한 스크롤 조회 */
export function useInfiniteBoards({
  category,
  size = 10,
}: UseInfiniteBoardsParams = {}) {
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = normalizeAccessToken(rawAccessToken);
  const enabled = isHydrated && hasToken(accessToken);

  return useInfiniteQuery({
    queryKey: ["boards", "infinite", category, size, accessToken],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchBoards({
        category,
        page: pageParam,
        size,
        accessToken: accessToken,
      }),
    getNextPageParam: (lastPage) => {
      const totalPages = Number(lastPage.totalPages ?? 0);
      if (!Number.isFinite(totalPages) || totalPages <= 0) return undefined;

      const nextPage = Number(lastPage.number ?? 0) + 1;
      return nextPage < totalPages ? nextPage : undefined;
    },
    enabled,
  });
}

/** 카테고리별 게시글 수 */
export function useBoardCount(category?: BoardCategory | "ALL") {
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = normalizeAccessToken(rawAccessToken);
  const enabled = isHydrated && hasToken(accessToken);

  const { data } = useQuery({
    queryKey: ["boards", "count-map", accessToken],
    queryFn: () => fetchBoardCountMap(accessToken as string),
    enabled,
    staleTime: 60 * 1000,
  });

  if (!data) return 0;
  if (!category || category === "ALL") return data.ALL;
  return data[category] ?? 0;
}
