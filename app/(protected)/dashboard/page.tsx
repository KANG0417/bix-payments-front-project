"use client";

import { useState, useEffect } from "react";
import { CategoryTagFilter } from "@widgets/post/CategoryTagFilter";
import { PostCountSummary } from "@widgets/post/PostCountSummary";
import { PostCardGridInfinite } from "@widgets/post/PostCardGridInfinite";
import { useAuthStore } from "@entities/user/model/auth-store";
import { usePostStore } from "@entities/post/model/post-store";
import { DEFAULT_CATEGORIES } from "@entities/post";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hydrate = usePostStore((s) => s.hydrate);
  const getTotalCount = usePostStore((s) => s.getTotalCount);
  const getFilteredCount = usePostStore((s) => s.getFilteredCount);
  const getAllTags = usePostStore((s) => s.getAllTags);

  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const authorId = user?.id ?? "";
  const totalCount = authorId ? getTotalCount(authorId) : 0;
  const currentFilterCount = authorId
    ? getFilteredCount(authorId, selectedCategory, selectedTag)
    : 0;
  const tags = authorId ? getAllTags(authorId) : [];

  return (
    <div className="space-y-6">
      <CategoryTagFilter
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        tags={tags}
        onCategoryChange={setSelectedCategory}
        onTagChange={setSelectedTag}
      />
      <PostCountSummary
        totalCount={totalCount}
        currentFilterCount={currentFilterCount}
        selectedCategory={selectedCategory}
      />
      <PostCardGridInfinite
        key={`${selectedCategory}:${selectedTag ?? "all"}`}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
      />
    </div>
  );
}
