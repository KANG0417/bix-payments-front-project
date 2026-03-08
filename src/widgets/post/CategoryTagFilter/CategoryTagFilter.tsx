"use client";

import { CATEGORIES } from "@entities/post/model/category";
import type { BoardCategory } from "@entities/post/model/category";

interface CategoryTagFilterProps {
  selectedCategory: BoardCategory | "ALL";
  onCategoryChange: (category: BoardCategory | "ALL") => void;
}

export function CategoryTagFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryTagFilterProps) {
  return (
    <section className="flex flex-col items-center gap-5">
      <nav aria-label="카테고리 필터">
        <h2 className="mb-3 self-start text-base font-bold text-slate-400">
          🌸 카테고리
        </h2>
        <ul className="flex flex-wrap justify-center gap-2.5 list-none p-0 m-0">
          {/* 전체 버튼 */}
          <li>
            <button
              type="button"
              onClick={() => onCategoryChange("ALL")}
              aria-pressed={selectedCategory === "ALL"}
              className={`cursor-pointer rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-200
                ${
                  selectedCategory === "ALL"
                    ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow-md shadow-pink-100 -translate-y-0.5"
                    : "bg-white/70 text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5"
                }`}
            >
              전체
            </button>
          </li>

          {/* API 카테고리 목록 */}
          {CATEGORIES.filter((c) => c.label !== "전체").map((cat) => (
            <li key={cat.value}>
              <button
                type="button"
                onClick={() => onCategoryChange(cat.value)}
                aria-pressed={selectedCategory === cat.value}
                className={`cursor-pointer rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-200
                  ${
                    selectedCategory === cat.value
                      ? "bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow-md shadow-pink-100 -translate-y-0.5"
                      : "bg-white/70 text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5"
                  }`}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
