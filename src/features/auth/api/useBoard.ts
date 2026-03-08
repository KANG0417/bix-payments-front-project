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

function normalizeAccessToken(token?: string | null) {
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, "").trim();
}

function isJwtExpired(token: string) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
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
  if (!normalizedToken || isJwtExpired(normalizedToken)) {
    useAuthStore.getState().logout();
    throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
  }

  const res = await fetch(`${BASE_URL}/boards?${params.toString()}`, {
    headers: normalizedToken
      ? {
          Authorization: `Bearer ${normalizedToken}`,
        }
      : undefined,
  });
  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
  }
  if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
  return res.json();
}

export function useBoards({
  category,
  page = 0,
  size = 10,
}: FetchBoardsParams = {}) {
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = normalizeAccessToken(rawAccessToken);
  const enabled = isHydrated && !!accessToken;

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
  const enabled = isHydrated && !!accessToken;

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
  const { data } = useBoards({ category, size: 1 });
  return data?.totalElements ?? 0;
}
