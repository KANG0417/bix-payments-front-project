import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { normalizeCategory, type BoardCategory } from "@entities/post/model/category";
import { useAuthStore } from "@entities/user/model/auth-store";
import { getMyIdentityCandidates, isMinePost } from "@features/post/model/ownership";
import { authApi } from "@shared/api/auth-api";

export interface BoardItem {
  id: number;
  title: string;
  content: string;
  category: BoardCategory;
  boardCategory?: BoardCategory | string;
  createdAt: string;
  updatedAt: string;
  writerId?: string | number;
  authorId?: string | number;
  userId?: string | number;
  username?: string;
  email?: string;
  writer?: string;
  createdBy?: string;
  isMine?: boolean;
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
  refreshToken?: string;
  sort?: "latest" | "oldest";
}

interface BoardCountMap {
  ALL: number;
  NOTICE: number;
  FREE: number;
  QNA: number;
  ETC: number;
}

function normalizeCategoryKey(value: unknown): keyof BoardCountMap | null {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();

  if (raw === "NOTICE" || raw === "공지") return "NOTICE";
  if (raw === "FREE" || raw === "자유") return "FREE";
  if (raw === "QNA" || raw === "질문") return "QNA";
  if (raw === "ETC" || raw === "기타") return "ETC";
  if (raw === "ALL" || raw === "전체") return "ALL";
  return null;
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
  sort = "latest",
}: FetchBoardsParams): Promise<BoardsResponse> {
  const params = new URLSearchParams();
  if (category && category !== "ALL") params.set("category", category);
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sort", `createdAt,${sort === "oldest" ? "asc" : "desc"}`);
  const { data } = await authApi.get<BoardsResponse>("/boards", {
    params: Object.fromEntries(params.entries()),
  });
  const content = Array.isArray(data.content) ? data.content : [];
  const normalizedContent = content.map((item) => ({
    ...item,
    // 일부 응답은 category와 boardCategory가 다르게 내려와서 boardCategory를 우선 사용
    category: normalizeCategory(item.boardCategory ?? item.category),
  }));
  const filteredContent =
    category && category !== "ALL"
      ? normalizedContent.filter((item) => item.category === category)
      : normalizedContent;

  return {
    ...data,
    content: filteredContent,
  };
}

async function fetchBoardCountMap(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): Promise<BoardCountMap> {
  const normalizedAccessToken = normalizeAccessToken(tokens.accessToken);
  const normalizedRefreshToken = normalizeAccessToken(tokens.refreshToken);

  const countMap: BoardCountMap = {
    ALL: 0,
    NOTICE: 0,
    FREE: 0,
    QNA: 0,
    ETC: 0,
  };

  const first = await fetchBoards({
    page: 0,
    size: 50,
    accessToken: normalizedAccessToken ?? undefined,
    refreshToken: normalizedRefreshToken ?? undefined,
  });
  const totalPages = Number(first.totalPages ?? 1);

  const collect = (items: BoardItem[]) => {
    countMap.ALL += items.length;
    items.forEach((item) => {
      const key = normalizeCategoryKey(item.category);
      if (key && key !== "ALL") countMap[key] += 1;
    });
  };

  collect(first.content);

  for (let page = 1; page < totalPages; page += 1) {
    const next = await fetchBoards({
      page,
      size: 50,
      accessToken: normalizedAccessToken ?? undefined,
      refreshToken: normalizedRefreshToken ?? undefined,
    });
    collect(next.content);
  }

  return countMap;
}

export function useBoards({
  category,
  page = 0,
  size = 10,
  sort = "latest",
}: FetchBoardsParams = {}) {
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const rawRefreshToken = useAuthStore((s) => s.refreshToken);
  const me = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = normalizeAccessToken(rawAccessToken);
  const refreshToken = normalizeAccessToken(rawRefreshToken);
  const myIdentities = getMyIdentityCandidates(accessToken, me);
  const enabled = isHydrated && !!(accessToken || refreshToken);

  return useQuery({
    queryKey: ["boards", category, page, size, sort, accessToken],
    queryFn: () =>
      fetchBoards({
        category,
        page,
        size,
        sort,
      }),
    select: (data) => ({
      ...data,
      content: data.content.map((post) => ({
        ...post,
        isMine: isMinePost(post as unknown as Record<string, unknown>, myIdentities),
      })),
    }),
    enabled,
    retry: false,
  });
}

interface UseInfiniteBoardsParams {
  category?: BoardCategory | "ALL";
  size?: number;
  sort?: "latest" | "oldest";
}

/** 게시글 무한 스크롤 조회 */
export function useInfiniteBoards({
  category,
  size = 10,
  sort = "latest",
}: UseInfiniteBoardsParams = {}) {
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const rawRefreshToken = useAuthStore((s) => s.refreshToken);
  const me = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = normalizeAccessToken(rawAccessToken);
  const refreshToken = normalizeAccessToken(rawRefreshToken);
  const myIdentities = getMyIdentityCandidates(accessToken, me);
  const enabled = isHydrated && !!(accessToken || refreshToken);

  return useInfiniteQuery({
    queryKey: ["boards", "infinite", category, size, sort, accessToken],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchBoards({
        category,
        page: pageParam,
        size,
        sort,
      }),
    getNextPageParam: (lastPage) => {
      const totalPages = Number(lastPage.totalPages ?? 0);
      if (!Number.isFinite(totalPages) || totalPages <= 0) return undefined;

      const nextPage = Number(lastPage.number ?? 0) + 1;
      return nextPage < totalPages ? nextPage : undefined;
    },
    select: (data) => ({
      ...data,
      pages: data.pages.map((pageData) => ({
        ...pageData,
        content: pageData.content.map((post) => ({
          ...post,
          isMine: isMinePost(post as unknown as Record<string, unknown>, myIdentities),
        })),
      })),
    }),
    enabled,
    retry: false,
  });
}

/** 카테고리별 게시글 수 */
export function useBoardCount(category?: BoardCategory | "ALL") {
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const rawRefreshToken = useAuthStore((s) => s.refreshToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = normalizeAccessToken(rawAccessToken);
  const refreshToken = normalizeAccessToken(rawRefreshToken);
  const enabled = isHydrated && !!(accessToken || refreshToken);

  const { data } = useQuery({
    queryKey: ["boards", "count-map", accessToken, refreshToken],
    queryFn: () =>
      fetchBoardCountMap({
        accessToken,
        refreshToken,
      }),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });

  if (!data) return 0;
  if (!category || category === "ALL") return data.ALL;
  return data[category] ?? 0;
}
