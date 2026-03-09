import axios from "axios";
import type { BoardCategory } from "@entities/post/model/category";
import { normalizeCategory } from "@entities/post/model/category";
import { authApi } from "@shared/api/auth-api";
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

function resolveAxiosError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
    ) {
      return (data as { message: string }).message;
    }
    if (error.response?.status) return `서버 오류 (${error.response.status})`;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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
  try {
    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" }),
    );
    if (file) {
      formData.append("file", file);
    }

    const { data } = await authApi.post("/boards", formData);
    return normalizeBoardResponse(data);
  } catch (error) {
    throw new Error(resolveAxiosError(error, "글 작성에 실패했습니다."));
  }
}

/** 게시글 단건 조회 */
export async function getBoardDetail(id: number): Promise<BoardResponse> {
  try {
    const { data } = await authApi.get(`/boards/${id}`);
    return normalizeBoardResponse(data);
  } catch (error) {
    throw new Error(resolveAxiosError(error, "게시글 조회에 실패했습니다."));
  }
}

/** 게시글 인접 글 조회 (목록 순서 기준) */
export async function getAdjacentBoards(
  id: number,
  sort: "latest" | "oldest" = "latest",
  category?: BoardCategory | "ALL",
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

    const { data: pageData } = await authApi.get("/boards", {
      params: Object.fromEntries(params.entries()),
    });
    const data = normalizeBoardsPageResponse(pageData, category);
    const content = Array.isArray(data.content) ? data.content : [];
    const scopedContent = content;
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

        const { data: nextPageData } = await authApi.get("/boards", {
          params: Object.fromEntries(nextParams.entries()),
        });
        const nextData = normalizeBoardsPageResponse(nextPageData, category);
        const nextContent = Array.isArray(nextData.content) ? nextData.content : [];
        const nextScopedContent = nextContent;
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
  try {
    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" }),
    );
    if (file) {
      formData.append("file", file);
    }

    await authApi.patch(`/boards/${id}`, formData);
  } catch (error) {
    throw new Error(resolveAxiosError(error, "글 수정에 실패했습니다."));
  }
}

/** 게시글 삭제 */
export async function deleteBoard(id: number): Promise<void> {
  try {
    await authApi.delete(`/boards/${id}`);
  } catch (error) {
    throw new Error(resolveAxiosError(error, "글 삭제에 실패했습니다."));
  }
}
