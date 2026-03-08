"use client";

import { DEFAULT_CATEGORIES } from "@entities/post";

interface CategoryTagFilterProps {
  selectedCategory: string;
  selectedTag: string | null;
  tags: string[];
  onCategoryChange: (category: string) => void;
  onTagChange: (tag: string | null) => void;
}

export function CategoryTagFilter({
  selectedCategory,
  selectedTag,
  tags,
  onCategoryChange,
  onTagChange,
}: CategoryTagFilterProps) {
  return (
    <section className="flex flex-col items-center gap-5">
      {/* 카테고리 */}
      <nav aria-label="카테고리 필터">
        <h2 className="mb-3 self-start text-base font-bold text-slate-400">
          🌸 카테고리
        </h2>
        <ul className="flex flex-wrap justify-center gap-2.5 list-none p-0 m-0">
          {DEFAULT_CATEGORIES.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => {
                  onCategoryChange(cat);
                  onTagChange(null);
                }}
                aria-pressed={selectedCategory === cat}
                className={`cursor-pointer rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-200
                  ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow-md shadow-pink-100 -translate-y-0.5"
                      : "bg-white/70 text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5"
                  }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 태그 */}
      {tags.length > 0 && (
        <nav aria-label="태그 필터">
          <h2 className="mb-3 self-start text-base font-bold text-slate-400">
            🏷️ 태그
          </h2>
          <ul className="flex flex-wrap justify-center gap-2.5 list-none p-0 m-0">
            <li>
              <button
                type="button"
                onClick={() => onTagChange(null)}
                aria-pressed={selectedTag === null}
                className={`cursor-pointer rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-200
                  ${
                    selectedTag === null
                      ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow-md shadow-pink-100 -translate-y-0.5"
                      : "bg-white/70 text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5"
                  }`}
              >
                전체
              </button>
            </li>
            {tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => onTagChange(tag)}
                  aria-pressed={selectedTag === tag}
                  className={`cursor-pointer rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-200
                    ${
                      selectedTag === tag
                        ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow-md shadow-pink-100 -translate-y-0.5"
                        : "bg-white/70 text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5"
                    }`}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}
