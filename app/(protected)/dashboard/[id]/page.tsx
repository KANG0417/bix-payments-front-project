"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { categoryToLabel, type BoardCategory } from "@entities/post/model/category";
import { isLocallyEditedPost } from "@entities/post/model/edited-posts";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";
import { ConfirmModal } from "@shared/ui/Modal";
import { deleteBoard, getAdjacentBoards, getBoardDetail } from "@features/post/api/board";
import { getMyIdentityCandidates, isMinePost } from "@features/post/model/ownership";
import type { BoardResponse } from "@features/post/api/board";

interface AttachmentItem {
  name: string;
  url: string;
  size?: number;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://front-mission.bigs.or.kr"
).replace(/\/$/, "");

function normalizeAccessToken(token?: string | null) {
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, "").trim();
}

function resolveApiUrl(rawUrl: string) {
  const url = String(rawUrl ?? "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

function guessFileNameFromUrl(url: string) {
  try {
    const pathname = new URL(url, API_BASE_URL).pathname;
    const last = pathname.split("/").pop();
    return decodeURIComponent(last || "첨부파일");
  } catch {
    return "첨부파일";
  }
}

function toAttachment(item: unknown): AttachmentItem | null {
  if (typeof item === "string") {
    const url = resolveApiUrl(item.trim());
    if (!url) return null;
    return { url, name: guessFileNameFromUrl(url) };
  }

  if (!item || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;
  const url = [
    obj.imageUrl,
    obj.downloadUrl,
    obj.fileUrl,
    obj.url,
    obj.path,
    obj.link,
    obj.presignedUrl,
  ]
    .map((v) => String(v ?? "").trim())
    .find(Boolean);

  if (!url) return null;
  const resolvedUrl = resolveApiUrl(url);
  if (!resolvedUrl) return null;

  const name =
    [
      obj.originalFileName,
      obj.fileName,
      obj.filename,
      obj.name,
      obj.storedFileName,
    ]
      .map((v) => String(v ?? "").trim())
      .find(Boolean) ?? guessFileNameFromUrl(resolvedUrl);

  const sizeNum = Number(obj.fileSize ?? obj.size);
  return {
    name,
    url: resolvedUrl,
    size: Number.isFinite(sizeNum) ? sizeNum : undefined,
  };
}

function extractAttachments(data: Record<string, unknown>) {
  const candidates = [
    data.files,
    data.attachments,
    data.attachmentFiles,
    data.fileList,
    data.uploadedFiles,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const attachments = candidate
      .map(toAttachment)
      .filter(Boolean) as AttachmentItem[];
    if (attachments.length > 0) return attachments;
  }

  const single = toAttachment(data.file ?? data.attachment);
  if (single) return [single];

  const directImage = toAttachment(data.imageUrl ?? data.image ?? data.thumbnailUrl);
  return directImage ? [directImage] : [];
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function normalizeSelectedCategory(value: string | null): BoardCategory {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "NOTICE") return "NOTICE";
  if (raw === "FREE") return "FREE";
  if (raw === "QNA") return "QNA";
  if (raw === "ETC") return "ETC";
  return "ALL";
}

function normalizeSortOrder(value: string | null): "latest" | "oldest" {
  return value === "oldest" ? "oldest" : "latest";
}

function getAdjacentFromInfiniteCache(
  queryClient: ReturnType<typeof useQueryClient>,
  boardId: number,
  sortOrder: "latest" | "oldest",
  category: BoardCategory,
  myIdentities: string[],
) {
  const queries = queryClient.getQueriesData({
    queryKey: ["boards", "infinite"],
  });

  const allBoards: BoardResponse[] = [];

  for (const [queryKey, queryData] of queries) {
    const key = queryKey as QueryKey;
    const categoryInKey = key[2];
    const sortInKey = key[4];
    const expectedCategoryInKey = category === "ALL" ? undefined : category;

    if (sortInKey !== sortOrder) continue;
    if (categoryInKey !== expectedCategoryInKey) continue;

    const data = queryData as
      | { pages?: Array<{ content?: BoardResponse[] }> }
      | undefined;
    const pages = Array.isArray(data?.pages) ? data.pages : [];

    for (const page of pages) {
      if (!Array.isArray(page?.content)) continue;
      allBoards.push(...page.content);
    }
  }

  const scopedBoards =
    myIdentities.length > 0
      ? allBoards.filter((post) =>
          isMinePost(post as unknown as Record<string, unknown>, myIdentities),
        )
      : allBoards;

  if (scopedBoards.length === 0) return null;

  const deduped = scopedBoards.filter((post, index, array) => {
    return (
      index === array.findIndex((candidate) => Number(candidate.id) === Number(post.id))
    );
  });

  const targetIndex = deduped.findIndex((post) => Number(post.id) === Number(boardId));
  if (targetIndex < 0) return null;

  return {
    newer: targetIndex > 0 ? deduped[targetIndex - 1] : null,
    older: targetIndex < deduped.length - 1 ? deduped[targetIndex + 1] : null,
  };
}

function getManagePermissionFromBoardCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  boardId: number,
  myIdentities: string[],
) {
  const cached = queryClient.getQueriesData({
    queryKey: ["boards"],
  });

  for (const [, queryData] of cached) {
    const data = queryData as
      | { content?: BoardResponse[]; pages?: Array<{ content?: BoardResponse[] }> }
      | undefined;

    const directContent = Array.isArray(data?.content) ? data.content : [];
    for (const item of directContent) {
      if (Number(item.id) !== Number(boardId)) continue;
      if (isMinePost(item as unknown as Record<string, unknown>, myIdentities)) {
        return true;
      }
    }

    const pages = Array.isArray(data?.pages) ? data.pages : [];
    for (const page of pages) {
      const content = Array.isArray(page?.content) ? page.content : [];
      for (const item of content) {
        if (Number(item.id) !== Number(boardId)) continue;
        if (isMinePost(item as unknown as Record<string, unknown>, myIdentities)) {
          return true;
        }
      }
    }
  }

  return false;
}

function isEditedPostRecord(
  post: Record<string, unknown>,
  postId?: number,
) {
  if (Number.isFinite(postId) && isLocallyEditedPost(Number(postId))) return true;

  const createdRaw = String(post.createdAt ?? "");
  const updatedRaw = String(post.updatedAt ?? post.modifiedAt ?? "");
  if (!createdRaw || !updatedRaw) return false;
  if (createdRaw !== updatedRaw) return true;

  const createdTs = new Date(createdRaw).getTime();
  const updatedTs = new Date(updatedRaw).getTime();
  return (
    Number.isFinite(createdTs) &&
    Number.isFinite(updatedTs) &&
    updatedTs > createdTs
  );
}

export default function DashboardPostDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const hasCategoryParam = searchParams.has("category");
  const boardId = Number(params.id);
  const me = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const myIdentities = getMyIdentityCandidates(accessToken, me);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedCategory = normalizeSelectedCategory(searchParams.get("category"));
  const sortOrder = normalizeSortOrder(searchParams.get("sort"));

  const { data, isLoading, isError } = useQuery({
    queryKey: ["board", boardId, ...myIdentities],
    queryFn: () => getBoardDetail(boardId),
    enabled: Number.isFinite(boardId),
    select: (post) => ({
      ...post,
      canManage: isMinePost(post as unknown as Record<string, unknown>, myIdentities),
    }),
  });

  // 목록으로/이전다음 기준은 "현재 글의 카테고리"가 아니라 "진입 당시 category 쿼리"를 우선한다.
  const categoryFromPost = normalizeSelectedCategory(String(data?.category ?? ""));
  const effectiveCategory = hasCategoryParam ? selectedCategory : categoryFromPost;

  const buildDetailHref = (id: number | string) =>
    `${ROUTES.DASHBOARD}/${id}?category=${effectiveCategory}&sort=${sortOrder}`;

  const { data: adjacent, isFetching: isAdjacentFetching } = useQuery({
    queryKey: ["board-adjacent", boardId, effectiveCategory, sortOrder, ...myIdentities],
    queryFn: async () => {
      const cached = getAdjacentFromInfiniteCache(
        queryClient,
        boardId,
        sortOrder,
        effectiveCategory,
        myIdentities,
      );
      if (cached) return cached;
      return getAdjacentBoards(boardId, sortOrder, effectiveCategory, myIdentities);
    },
    enabled:
      Number.isFinite(boardId) &&
      boardId > 0 &&
      (hasCategoryParam || !!data),
    retry: 0,
  });

  // 목록 정렬 기준에 따라 "이전/다음" 의미를 맞춘다.
  // - latest: 이전=newer, 다음=older
  // - oldest: 이전=older, 다음=newer
  const rawNextData =
    sortOrder === "latest" ? (adjacent?.older ?? null) : (adjacent?.newer ?? null);
  const rawPrevData =
    sortOrder === "latest" ? (adjacent?.newer ?? null) : (adjacent?.older ?? null);

  const belongsToEffectiveCategory = (post: BoardResponse | null) => {
    if (!post) return false;
    if (effectiveCategory === "ALL") return true;
    const category = normalizeSelectedCategory(
      String(post.boardCategory ?? post.category ?? ""),
    );
    return category === effectiveCategory;
  };

  const nextData =
    !isAdjacentFetching && belongsToEffectiveCategory(rawPrevData)
      ? rawPrevData
      : null;
  const prevData =
    !isAdjacentFetching && belongsToEffectiveCategory(rawNextData)
      ? rawNextData
      : null;

  const { mutate: removeBoard, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteBoard(boardId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      router.push(`${ROUTES.DASHBOARD}?category=${effectiveCategory}&sort=${sortOrder}`);
    },
    onError: (error: Error) => alert(`삭제 실패: ${error.message}`),
  });

  const canManageFromCache = useMemo(
    () => getManagePermissionFromBoardCaches(queryClient, boardId, myIdentities),
    [queryClient, boardId, myIdentities],
  );

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 h-8 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mb-2 h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="mb-6 h-20 w-full animate-pulse rounded bg-slate-100" />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
        게시글을 불러오지 못했어요.
      </section>
    );
  }

  const canManagePost = !!data.canManage || canManageFromCache;
  const attachments = extractAttachments(data as Record<string, unknown>);
  const isUpdatedPost = isEditedPostRecord(
    data as unknown as Record<string, unknown>,
    boardId,
  );

  const handleDownload = async (file: AttachmentItem) => {
    const normalizedToken = normalizeAccessToken(accessToken);
    if (!normalizedToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    setDownloadingUrl(file.url);
    try {
      const res = await fetch("/api/attachments/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${normalizedToken}`,
        },
        body: JSON.stringify({
          url: file.url,
          name: file.name,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message || `다운로드 실패 (${res.status})`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.name || "첨부파일";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "파일 다운로드에 실패했어요. 잠시 후 다시 시도해주세요.";
      alert(message);
    } finally {
      setDownloadingUrl(null);
    }
  };

  return (
    <section className="min-h-[calc(100vh-68px)] bg-[#F9FAFB] px-4 py-8 font-sans sm:px-6">
      <div className="mx-auto max-w-4xl">
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_42px_-30px_rgba(15,23,42,0.35)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="pointer-events-none absolute left-0 top-0 h-8 w-full text-orange-100/80"
          >
            <path
              fill="currentColor"
              d="M0,64 C90,38 180,90 270,64 C360,38 450,90 540,64 C630,38 720,90 810,64 C900,38 990,90 1080,64 C1140,48 1170,48 1200,56 L1200,0 L0,0 Z"
            />
          </svg>

          <div className="px-6 pb-8 pt-10 sm:px-10">
            <header className="mb-6">
              <span className="mb-3 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                카테고리 · {categoryToLabel(data.category)}
              </span>
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
                {data.title}
              </h1>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <time className="text-sm text-slate-400">
                    {new Date(data.createdAt).toLocaleString("ko-KR")}
                  </time>
                  {isUpdatedPost && (
                    <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                      수정됨
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`${ROUTES.POST_WRITE}?mode=edit&id=${boardId}`)}
                    className="cursor-pointer rounded-full border border-yellow-200 bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-200"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="cursor-pointer rounded-full border border-[#f6c7b2] bg-[#ffe8dc] px-4 py-2 text-sm font-semibold text-[#b76842] transition hover:bg-[#ffdccc] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </header>

            <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
              <article className="whitespace-pre-wrap text-[15px] leading-8 text-slate-700 sm:text-base sm:leading-9">
                {data.content}
              </article>
            </section>

            {attachments.length > 0 && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-700">첨부파일</h2>
                  <a
                    href={attachments[0]?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 transition hover:bg-yellow-200"
                  >
                    미리보기
                  </a>
                </div>
                <ul className="space-y-2">
                  {attachments.map((file) => (
                    <li
                      key={`${file.url}-${file.name}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">{file.name}</p>
                        {formatSize(file.size) && (
                          <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        disabled={downloadingUrl === file.url}
                        aria-label={`${file.name} 다운로드`}
                        title={downloadingUrl === file.url ? "다운로드 중" : "다운로드"}
                        className="shrink-0 cursor-pointer rounded-lg border border-yellow-300 bg-white p-2 text-yellow-700 transition hover:bg-yellow-100 hover:text-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingUrl === file.url ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              stroke="currentColor"
                              strokeWidth="3"
                              className="opacity-25"
                            />
                            <path
                              d="M21 12a9 9 0 0 0-9-9"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              className="opacity-90"
                            />
                          </svg>
                        ) : (
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 3v11" />
                            <path d="m7 10 5 5 5-5" />
                            <path d="M4 20h16" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <footer className="mt-8 space-y-3 border-t border-slate-100 pt-5">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center justify-start">
                  {nextData ? (
                    <Link
                      href={buildDetailHref(nextData.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
                    >
                      <p className="text-xs font-semibold text-slate-400">다음 게시글</p>
                      <p className="flex min-w-0 items-center font-semibold text-slate-700">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="mr-1 inline h-4 w-4 align-[-2px] text-slate-600"
                          fill="currentColor"
                        >
                          <path d="M15 4 7 12l8 8V4Z" />
                        </svg>
                        <span className="block min-w-0 truncate">{nextData.title}</span>
                      </p>
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-center justify-center">
                  <Link
                    href={`${ROUTES.DASHBOARD}?category=${effectiveCategory}&sort=${sortOrder}`}
                    className="group inline-flex h-9 w-9 items-center justify-center gap-0 overflow-hidden rounded-xl bg-[#fff9cc] px-0 transition-all duration-300 hover:w-28 hover:justify-start hover:gap-2 hover:bg-[#fff4b0] hover:px-2"
                  >
                    <span className="flex h-5 w-5 flex-col justify-center gap-0.5">
                      <span className="h-0.5 w-4 rounded bg-amber-700" />
                      <span className="h-0.5 w-4 rounded bg-amber-700" />
                      <span className="h-0.5 w-4 rounded bg-amber-700" />
                    </span>
                    <span className="max-w-0 -translate-x-1 whitespace-nowrap text-sm font-semibold text-amber-800 opacity-0 transition-all duration-300 ease-out group-hover:max-w-[72px] group-hover:translate-x-0 group-hover:opacity-100">
                      목록으로
                    </span>
                  </Link>
                </div>
                <div className="flex items-center justify-end">
                  {prevData ? (
                    <Link
                      href={buildDetailHref(prevData.id)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
                    >
                      <p className="text-xs font-semibold text-slate-400">이전 게시글</p>
                      <p className="flex min-w-0 items-center font-semibold text-slate-700">
                        <span className="block min-w-0 truncate">{prevData.title}</span>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="ml-2 h-4 w-4 shrink-0 text-slate-600"
                          fill="currentColor"
                        >
                          <path d="m9 4 8 8-8 8V4Z" />
                        </svg>
                      </p>
                    </Link>
                  ) : null}
                </div>
              </div>
            </footer>
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="pointer-events-none absolute bottom-0 left-0 h-7 w-full -scale-y-100 text-orange-100/80"
          >
            <path
              fill="currentColor"
              d="M0,64 C90,38 180,90 270,64 C360,38 450,90 540,64 C630,38 720,90 810,64 C900,38 990,90 1080,64 C1140,48 1170,48 1200,56 L1200,0 L0,0 Z"
            />
          </svg>
        </article>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        isConfirmDisabled={isDeleting}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          removeBoard();
          setShowDeleteConfirm(false);
        }}
        title="게시글을 삭제할까요?"
        description="지워지면 복구할 수 없습니다."
        confirmButtonText="삭제하기"
      />

    </section>
  );
}
