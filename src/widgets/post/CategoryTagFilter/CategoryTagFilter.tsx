"use client";

import { DEFAULT_CATEGORIES } from "@entities/post";

interface CategoryTagFilterProps {
  selectedCategory: string;
  selectedTag: string | null;
  tags: string[];
  onCategoryChange: (category: string) => void;
  onTagChange: (tag: string | null) => void;
}

const activeClass =
  "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900";
const inactiveClass =
  "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600";

export function CategoryTagFilter({
  selectedCategory,
  selectedTag,
  tags,
  onCategoryChange,
  onTagChange,
}: CategoryTagFilterProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          카테고리
        </p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onCategoryChange(cat);
                onTagChange(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === cat ? activeClass : inactiveClass}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {tags.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            태그
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onTagChange(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedTag === null ? activeClass : inactiveClass}`}
            >
              전체
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagChange(tag)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedTag === tag ? activeClass : inactiveClass}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
