"use client";

import { useEffect, useRef, useState } from "react";
import { PostCard } from "@entities/post/ui/PostCard";
import { LoadingBar } from "@shared/ui/LoadingBar";
import type { BoardCategory } from "@entities/post/model/category";
import { useBoards } from "@/src/features/auth/api/useBoard";

interface PostCardGridInfiniteProps {
  selectedCategory: BoardCategory | "ALL";
}

const PAGE_SIZE = 9;

export function PostCardGridInfinite({
  selectedCategory,
}: PostCardGridInfiniteProps) {
  const [page, setPage] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // 카테고리 바뀌면 페이지 초기화
  useEffect(() => {
    setPage(0);
  }, [selectedCategory]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const { data, isLoading, isError } = useBoards({
    category: selectedCategory,
    page,
    size: PAGE_SIZE,
  });

  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages - 1;
  const items = data?.content ?? [];

  useEffect(() => {
    if (!hasMore || isFetchingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (timerRef.current) return;
        setIsFetchingMore(true);
        timerRef.current = window.setTimeout(() => {
          setPage((p) => p + 1);
          setIsFetchingMore(false);
          timerRef.current = null;
        }, 400);
      },
      { rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore]);

  if (isLoading) return <LoadingBar />;

  if (isError)
    return (
      <p className="py-16 text-center text-sm text-slate-400">
        게시글을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
      </p>
    );

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          아직 글이 없어요. 첫 글을 작성해 보세요 🌸
        </p>
      )}

      <div ref={sentinelRef} className="h-4 w-full" />

      {isFetchingMore && (
        <output className="flex justify-center py-8">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </output>
      )}
    </>
  );
}
