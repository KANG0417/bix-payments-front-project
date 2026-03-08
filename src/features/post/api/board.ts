const BASE_URL = "https://front-mission.bigs.or.kr";

import type { BoardCategory } from "@entities/post/model/category";
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

  const res = await fetch(`${BASE_URL}/boards`, {
    method: "POST",
    body: formData,
    // Content-Type은 브라우저가 boundary 포함해서 자동 설정
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `서버 오류 (${res.status})`);
  }

  return res.json();
}
