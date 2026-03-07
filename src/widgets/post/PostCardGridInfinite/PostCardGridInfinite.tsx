"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PostCard } from "@entities/post/ui/PostCard";
import { useAuthStore } from "@entities/user/model/auth-store";
import { usePostStore } from "@entities/post/model/post-store";
import { LoadingBar } from "@shared/ui/LoadingBar";

interface PostCardGridInfiniteProps {
  selectedCategory: string;
  selectedTag: string | null;
}

const PAGE_SIZE = 9;
const LOADING_DELAY_MS = 400;

export function PostCardGridInfinite({
  selectedCategory,
  selectedTag,
}: PostCardGridInfiniteProps) {
  const user = useAuthStore((s) => s.user);
  const authorId = user?.id ?? "";

  const hydrate = usePostStore((s) => s.hydrate);
  const isHydrated = usePostStore((s) => s.isHydrated);
  const posts = usePostStore((s) => s.posts);

  const [page, setPage] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (!authorId) return [];
    let list = posts
      .filter((p) => p.authorId === authorId)
      .sort((a, b) => b.createdAt - a.createdAt);
    if (selectedCategory && selectedCategory !== "전체") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (selectedTag) {
      list = list.filter((p) => p.tags.includes(selectedTag));
    }
    return list;
  }, [posts, authorId, selectedCategory, selectedTag]);

  const items = useMemo(() => {
    const take = (page + 1) * PAGE_SIZE;
    return filteredPosts.slice(0, take);
  }, [filteredPosts, page]);

  const hasMore = items.length < filteredPosts.length;

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
        }, LOADING_DELAY_MS);
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore]);

  if (!authorId) return null;

  return (
    <>
      {!isHydrated ? <LoadingBar /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {items.length === 0 && isHydrated ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
          아직 글이 없습니다. 글쓰기 버튼으로 첫 글을 작성해 보세요.
        </div>
      ) : null}
      <div ref={sentinelRef} className="h-4 w-full" />
      {isFetchingMore ? (
        <div className="flex justify-center py-8">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-400" />
        </div>
      ) : null}
    </>
  );
}
