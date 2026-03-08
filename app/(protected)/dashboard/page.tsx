"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryTagFilter } from "@widgets/post/CategoryTagFilter";
import { PostCountSummary } from "@widgets/post/PostCountSummary";
import { PostCardGridInfinite } from "@widgets/post/PostCardGridInfinite";
import type { BoardCategory } from "@entities/post/model/category";
import { useBoardCount } from "@/src/features/auth/api/useBoard";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<
    BoardCategory | "ALL"
  >("ALL");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  useEffect(() => {
    const sort = searchParams.get("sort");
    if (sort === "oldest") {
      setSortOrder("oldest");
      return;
    }
    setSortOrder("latest");
  }, [searchParams]);

  // 전체 게시글 수
  const totalCount = useBoardCount("ALL");

  // 현재 선택된 카테고리 게시글 수
  const currentFilterCount = useBoardCount(selectedCategory);

  return (
    <div className="space-y-6">
      <CategoryTagFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PostCountSummary
          totalCount={totalCount}
          currentFilterCount={currentFilterCount}
          selectedCategory={selectedCategory}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">정렬</span>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSortOrder("latest")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                sortOrder === "latest"
                  ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("oldest")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                sortOrder === "oldest"
                  ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              오래된순
            </button>
          </div>
        </div>
      </div>
      <PostCardGridInfinite
        key={`${selectedCategory}-${sortOrder}`}
        selectedCategory={selectedCategory}
        sortOrder={sortOrder}
      />
    </div>
  );
}
