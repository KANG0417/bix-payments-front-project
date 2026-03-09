const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://front-mission.bigs.or.kr"
).replace(/\/$/, "");

import type { BoardCategory } from "@entities/post/model/category";
import { useAuthStore } from "@entities/user/model/auth-store";
import { normalizeCategory } from "@entities/post/model/category";
import { refreshAccessToken } from "@features/auth/api/refresh";
import { isMinePost } from "@features/post/model/ownership";
export type { BoardCategory };

export interface CreateBoardRequest {
  title: string;
  content: string;
  category: BoardCategory;
}

export interface BoardResponse {
  id: number;
  title: string;
  content: string;
  category: BoardCategory;
  boardCategory?: BoardCategory | string;
  createdAt: string;
  updatedAt: string;
  writerId?: string | number;
  authorId?: string;
  userId?: string | number;
  username?: string;
  email?: string;
  writer?: string;
  createdBy?: string;
}

interface BoardsPageResponse {
  content: BoardResponse[];
  totalPages: number;
}

export interface UpdateBoardRequest {
  title: string;
  content: string;
  category: BoardCategory;
}

function normalizeAccessToken(token?: string | null) {
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, "").trim();
}

function getAccessToken() {
  const accessTokenFromStore = normalizeAccessToken(
    useAuthStore.getState().accessToken,
  );
  if (accessTokenFromStore) return accessTokenFromStore;

  if (typeof window === "undefined") return null;
  try {
    const persisted = window.localStorage.getItem("blog-auth");
    if (!persisted) return null;
    const parsed = JSON.parse(persisted) as {
      state?: { accessToken?: string | null };
    };
    return normalizeAccessToken(parsed.state?.accessToken ?? null);
  } catch {
    return null;
  }
}

function getRefreshToken() {
  const refreshTokenFromStore = normalizeAccessToken(
    useAuthStore.getState().refreshToken,
  );
  if (refreshTokenFromStore) return refreshTokenFromStore;

  if (typeof window === "undefined") return null;
  try {
    const persisted = window.localStorage.getItem("blog-auth");
    if (!persisted) return null;
    const parsed = JSON.parse(persisted) as {
      state?: { refreshToken?: string | null };
    };
    return normalizeAccessToken(parsed.state?.refreshToken ?? null);
  } catch {
    return null;
  }
}

async function authFetch(url: string, init: RequestInit = {}) {
  let accessToken = normalizeAccessToken(getAccessToken());
  const refreshToken = normalizeAccessToken(getRefreshToken());

  if (!accessToken && refreshToken) {
    accessToken = await refreshAccessToken();
  }

  if (!accessToken) {
    throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
  }

  let res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401 && refreshToken) {
    const renewedAccessToken = await refreshAccessToken();
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${renewedAccessToken}`,
      },
    });
  }

  if (res.status === 401) {
    useAuthStore.getState().setSessionExpired(true);
    throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
  }

  return res;
}

function normalizeBoardResponse(raw: unknown): BoardResponse {
  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    ...(item as unknown as BoardResponse),
    category: normalizeCategory(item.category ?? item.boardCategory),
    boardCategory: String(item.boardCategory ?? item.category ?? "ETC"),
  };
}

function normalizeBoardsPageResponse(
  raw: unknown,
  expectedCategory?: BoardCategory | "ALL",
): BoardsPageResponse {
  const page = (raw ?? {}) as Record<string, unknown>;
  const content = Array.isArray(page.content) ? page.content : [];
  const normalizedContent = content.map((item) => normalizeBoardResponse(item));
  const filteredContent =
    expectedCategory && expectedCategory !== "ALL"
      ? normalizedContent.filter((item) => item.category === expectedCategory)
      : normalizedContent;
  return {
    ...(page as unknown as BoardsPageResponse),
    content: filteredContent,
    totalPages: Number(page.totalPages ?? 1),
  };
}

/** 게시글 작성 - multipart/form-data
 *  request: JSON blob (application/json)
 *  file:    첨부파일 (optional, 단일)
 */
export async function createBoard(
  request: CreateBoardRequest,
  file?: File,
): Promise<BoardResponse> {
  const formData = new FormData();

  formData.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" }),
  );

  if (file) {
    formData.append("file", file);
  }

  const res = await authFetch(`${BASE_URL}/boards`, {
    method: "POST",
    body: formData,
    // Content-Type은 브라우저가 boundary 포함해서 자동 설정
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `서버 오류 (${res.status})`);
  }

  return normalizeBoardResponse(await res.json());
}

/** 게시글 단건 조회 */
export async function getBoardDetail(id: number): Promise<BoardResponse> {
  const res = await authFetch(`${BASE_URL}/boards/${id}`, {
    method: "GET",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `서버 오류 (${res.status})`);
  }

  return normalizeBoardResponse(await res.json());
}

/** 게시글 인접 글 조회 (목록 순서 기준) */
export async function getAdjacentBoards(
  id: number,
  sort: "latest" | "oldest" = "latest",
  category?: BoardCategory | "ALL",
  myIdentities: string[] = [],
): Promise<{ newer: BoardResponse | null; older: BoardResponse | null }> {
  const size = 20;
  let page = 0;
  let totalPages = 1;
  let previousPageLast: BoardResponse | null = null;

  while (page < totalPages) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sort", `createdAt,${sort === "oldest" ? "asc" : "desc"}`);
    if (category && category !== "ALL") {
      params.set("category", category);
    }

    const res = await authFetch(`${BASE_URL}/boards?${params.toString()}`, {
      method: "GET",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `서버 오류 (${res.status})`);
    }

    const data = normalizeBoardsPageResponse(await res.json(), category);
    const content = Array.isArray(data.content) ? data.content : [];
    const scopedContent =
      myIdentities.length > 0
        ? content.filter((post) =>
            isMinePost(post as unknown as Record<string, unknown>, myIdentities),
          )
        : content;
    totalPages = Number(data.totalPages ?? 1);
    const index = scopedContent.findIndex((post) => Number(post.id) === Number(id));

    if (index >= 0) {
      const newer = index > 0 ? scopedContent[index - 1] : previousPageLast;

      let older: BoardResponse | null = null;
      if (index < scopedContent.length - 1) {
        older = scopedContent[index + 1];
      } else if (page + 1 < totalPages) {
        const nextParams = new URLSearchParams();
        nextParams.set("page", String(page + 1));
        nextParams.set("size", String(size));
        nextParams.set("sort", `createdAt,${sort === "oldest" ? "asc" : "desc"}`);
        if (category && category !== "ALL") {
          nextParams.set("category", category);
        }

        const nextRes = await authFetch(`${BASE_URL}/boards?${nextParams.toString()}`, {
          method: "GET",
        });

        if (!nextRes.ok) {
          const errorText = await nextRes.text();
          throw new Error(errorText || `서버 오류 (${nextRes.status})`);
        }

        const nextData = normalizeBoardsPageResponse(await nextRes.json(), category);
        const nextContent = Array.isArray(nextData.content) ? nextData.content : [];
        const nextScopedContent =
          myIdentities.length > 0
            ? nextContent.filter((post) =>
                isMinePost(post as unknown as Record<string, unknown>, myIdentities),
              )
            : nextContent;
        older = nextScopedContent?.[0] ?? null;
      }

      return { newer: newer ?? null, older: older ?? null };
    }

    previousPageLast =
      scopedContent.length > 0
        ? scopedContent[scopedContent.length - 1]
        : previousPageLast;
    page += 1;
  }

  return { newer: null, older: null };
}

/** 게시글 수정 */
export async function updateBoard(
  id: number,
  request: UpdateBoardRequest,
  file?: File,
): Promise<void> {
  const formData = new FormData();
  formData.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" }),
  );
  if (file) {
    formData.append("file", file);
  }

  const res = await authFetch(`${BASE_URL}/boards/${id}`, {
    method: "PATCH",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `서버 오류 (${res.status})`);
  }
}

/** 게시글 삭제 */
export async function deleteBoard(id: number): Promise<void> {
  const res = await authFetch(`${BASE_URL}/boards/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `서버 오류 (${res.status})`);
  }
}
