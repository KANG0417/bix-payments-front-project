"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { PostCard } from "@entities/post/ui/PostCard";
import type { BoardCategory } from "@entities/post/model/category";
import { hasToken, useInfiniteBoards } from "@/src/features/auth/api/useBoard";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";

interface PostCardGridInfiniteProps {
  selectedCategory: BoardCategory | "ALL";
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
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }, (_, idx) => (
        <PostCardSkeleton key={idx} />
      ))}
    </section>
  );
}

export function PostCardGridInfinite({
  selectedCategory,
}: PostCardGridInfiniteProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wasIntersectingRef = useRef(false);
  const rawAccessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hasUsableToken = hasToken(
    rawAccessToken?.replace(/^Bearer\s+/i, "").trim() ?? null,
  );

  // ✨ 핵심 수정: API 파라미터에서 "ALL"은 제외(undefined) 처리
  // 이렇게 하면 서버에는 category 파라미터가 가지 않아 전체 글을 불러옵니다.
  const queryCategory =
    selectedCategory === "ALL" ? undefined : selectedCategory;

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteBoards({
    category: queryCategory,
    size: PAGE_SIZE,
  });
  const items = data?.pages.flatMap((pageData) => pageData.content) ?? [];
  const posts = items.map((item) => ({
    id: String(item.id),
    authorId: "",
    title: item.title,
    content: item.content,
    category: item.category,
    tags: [],
    createdAt: new Date(item.createdAt).getTime(),
    updatedAt: new Date(item.updatedAt).getTime(),
  }));
  const filteredPosts =
    selectedCategory === "ALL"
      ? posts
      : posts.filter(
          (post) =>
            String(post.category).toUpperCase() ===
            String(selectedCategory).toUpperCase(),
        );

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = !!entries[0]?.isIntersecting;
        if (
          isIntersecting &&
          !wasIntersectingRef.current &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
        wasIntersectingRef.current = isIntersecting;
      },
      { rootMargin: "80px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isHydrated && !hasUsableToken) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
        <p className="mb-3">세션이 만료되었거나 인증 정보가 없어요.</p>
        <Link
          href={ROUTES.LOGIN}
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
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 5 }, (_, idx) => (
            <PostCardSkeleton key={`skeleton-${idx}`} />
          ))}
      </section>

      {filteredPosts.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          아직 글이 없어요. 첫 글을 작성해 보세요 🌸
        </p>
      )}

      <div ref={sentinelRef} className="h-4 w-full" />

    </>
  );
}
