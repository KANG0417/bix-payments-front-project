"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PostCard } from "@entities/post/ui/PostCard";
import type { BoardCategory } from "@entities/post/model/category";
import { isLocallyEditedPost } from "@entities/post/model/edited-posts";
import { hasToken, useInfiniteBoards } from "@/src/features/auth/api/useBoard";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";
import { refreshAccessToken } from "@features/auth/api/refresh";

interface PostCardGridInfiniteProps {
  selectedCategory: BoardCategory | "ALL";
  sortOrder: "latest" | "oldest";
}

const PAGE_SIZE = 10;
const SKELETON_COUNT = 10;

function PostCardSkeleton() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 h-5 w-16 animate-pulse rounded bg-slate-200" />
      <div className="mb-2 h-6 w-4/5 animate-pulse rounded bg-slate-200" />
      <div className="mb-2 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="mb-2 h-4 w-11/12 animate-pulse rounded bg-slate-100" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
    </article>
  );
}

function PostCardGridSkeleton({ count = SKELETON_COUNT }: { count?: number }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, idx) => (
        <PostCardSkeleton key={idx} />
      ))}
    </section>
  );
}

function normalizeCategory(value: unknown): BoardCategory | "ALL" | null {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "ALL" || raw === "전체") return "ALL";
  if (raw === "NOTICE" || raw === "공지") return "NOTICE";
  if (raw === "FREE" || raw === "자유") return "FREE";
  if (raw === "QNA" || raw === "질문") return "QNA";
  if (raw === "ETC" || raw === "기타") return "ETC";
  return null;
}

export function PostCardGridInfinite({
  selectedCategory,
  sortOrder,
}: PostCardGridInfiniteProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const rawRefreshToken = useAuthStore((s) => s.refreshToken);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);
  const [isRecoveringSession, setIsRecoveringSession] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const hasAccessToken = hasToken(
    rawAccessToken?.replace(/^Bearer\s+/i, "").trim() ?? null,
  );
  const hasRefreshToken = hasToken(
    rawRefreshToken?.replace(/^Bearer\s+/i, "").trim() ?? null,
  );

  // ✨ 핵심 수정: API 파라미터에서 "ALL"은 제외(undefined) 처리
  // 이렇게 하면 서버에는 category 파라미터가 가지 않아 전체 글을 불러옵니다.
  const queryCategory =
    selectedCategory === "ALL" ? undefined : selectedCategory;

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteBoards({
    category: queryCategory,
    size: PAGE_SIZE,
    sort: sortOrder,
  });
  const items = data?.pages.flatMap((pageData) => pageData.content) ?? [];
  const posts = items.map((item) => {
    const createdRaw = String(item.createdAt ?? "");
    const updatedRaw = String(item.updatedAt ?? "");
    const createdAt = new Date(createdRaw).getTime();
    const updatedAt = new Date(updatedRaw).getTime();
    const isEdited =
      isLocallyEditedPost(Number(item.id)) ||
      (createdRaw.length > 0 && updatedRaw.length > 0 && createdRaw !== updatedRaw) ||
      (Number.isFinite(createdAt) &&
        Number.isFinite(updatedAt) &&
        updatedAt > createdAt);

    return {
      id: String(item.id),
      authorId: "",
      title: item.title,
      content: item.content,
      category: item.category,
      tags: [],
      createdAt,
      updatedAt,
      isEdited,
    };
  });
  const filteredPosts =
    selectedCategory === "ALL"
      ? posts
      : posts.filter(
          (post) => normalizeCategory(post.category) === selectedCategory,
        );
  const sortedPosts = [...filteredPosts].sort((a, b) =>
    sortOrder === "latest"
      ? b.createdAt - a.createdAt
      : a.createdAt - b.createdAt,
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (!hasRefreshToken) return;
    if (hasAccessToken && !sessionExpired) return;
    if (isRecoveringSession) return;
    if (refreshFailed) return;

    let mounted = true;
    setIsRecoveringSession(true);
    setRefreshFailed(false);

    refreshAccessToken()
      .then(() => {
        if (!mounted) return;
        setSessionExpired(false);
      })
      .catch(() => {
        if (!mounted) return;
        setRefreshFailed(true);
      })
      .finally(() => {
        if (!mounted) return;
        setIsRecoveringSession(false);
      });

    return () => {
      mounted = false;
    };
  }, [
    isHydrated,
    hasAccessToken,
    hasRefreshToken,
    sessionExpired,
    isRecoveringSession,
    refreshFailed,
    setSessionExpired,
  ]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = !!entries[0]?.isIntersecting;
        if (isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;
    if (typeof window === "undefined") return;

    const doc = document.documentElement;
    const hasScrollableSpace = doc.scrollHeight > window.innerHeight + 80;
    if (!hasScrollableSpace) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, sortedPosts.length]);

  if (isHydrated && !hasRefreshToken && !hasAccessToken) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
        <p className="mb-3">인증 정보가 없어요.</p>
        <Link
          href={ROUTES.SIGNIN}
          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          로그인하러 가기
        </Link>
      </section>
    );
  }

  if (isHydrated && (isRecoveringSession || (!hasAccessToken && hasRefreshToken))) {
    return <PostCardGridSkeleton />;
  }

  if (isHydrated && refreshFailed && sessionExpired && !hasAccessToken) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
        <p className="mb-3">세션이 만료되어 재접속에 실패했어요.</p>
        <Link
          href={ROUTES.SIGNIN}
          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          로그인하러 가기
        </Link>
      </section>
    );
  }

  if (isLoading) return <PostCardGridSkeleton />;

  if (isError) return <PostCardGridSkeleton />;

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            href={`${ROUTES.DASHBOARD}/${post.id}?category=${selectedCategory}&sort=${sortOrder}`}
          />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 5 }, (_, idx) => (
            <PostCardSkeleton key={`skeleton-${idx}`} />
          ))}
      </section>

      {sortedPosts.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          아직 글이 없어요. 첫 글을 작성해 보세요 🌸
        </p>
      )}

      <div ref={sentinelRef} className="h-4 w-full" />

      {hasNextPage && !isFetchingNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            게시글 더 보기
          </button>
        </div>
      )}

    </>
  );
}
