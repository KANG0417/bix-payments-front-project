const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

import type { BoardCategory } from "@entities/post/model/category";
import { useAuthStore } from "@entities/user/model/auth-store";
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
  createdAt: string;
  updatedAt: string;
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

/** 게시글 작성 - multipart/form-data
 *  request: JSON blob (application/json)
 *  file:    첨부파일 (optional, 단일)
 */
export async function createBoard(
  request: CreateBoardRequest,
  file?: File,
): Promise<BoardResponse> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
  }

  const formData = new FormData();

  formData.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" }),
  );

  if (file) {
    formData.append("file", file);
  }

  const res = await fetch(`${BASE_URL}/boards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
    // Content-Type은 브라우저가 boundary 포함해서 자동 설정
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `서버 오류 (${res.status})`);
  }

  return res.json();
}
