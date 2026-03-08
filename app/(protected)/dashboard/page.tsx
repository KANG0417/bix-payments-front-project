"use client";

import { useState } from "react";
import { CategoryTagFilter } from "@widgets/post/CategoryTagFilter";
import { PostCountSummary } from "@widgets/post/PostCountSummary";
import { PostCardGridInfinite } from "@widgets/post/PostCardGridInfinite";
import type { BoardCategory } from "@entities/post/model/category";
import { useBoardCount } from "@/src/features/auth/api/useBoard";

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    BoardCategory | "ALL"
  >("ALL");

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
      <PostCountSummary
        totalCount={totalCount}
        currentFilterCount={currentFilterCount}
        selectedCategory={selectedCategory}
      />
      <PostCardGridInfinite
        key={selectedCategory}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}
