"use client";

import { categoryToLabel } from "@entities/post/model/category"; // 경로에 맞춰 수정하세요

interface PostCountSummaryProps {
  totalCount: number;
  currentFilterCount: number;
  selectedCategory: string; // "ALL", "NOTICE" 등이 들어옴
}

export function PostCountSummary({
  totalCount,
  currentFilterCount,
  selectedCategory,
}: PostCountSummaryProps) {
  // "ALL"일 때는 "전체"로, 그 외에는 함수를 통해 한글 label로 변환
  const displayLabel =
    selectedCategory === "ALL"
      ? "전체"
      : categoryToLabel(selectedCategory as any);

  return (
    <p className="text-sm text-slate-600 dark:text-slate-400">
      {selectedCategory === "ALL" || selectedCategory === "전체" ? (
        <>
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            전체
          </strong>{" "}
          글{" "}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            {totalCount}
          </strong>
          개
        </>
      ) : (
        <>
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            {displayLabel}
          </strong>{" "}
          글{" "}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            {currentFilterCount}
          </strong>
          개
          {totalCount !== currentFilterCount && (
            <span className="ml-1">(전체 {totalCount}개)</span>
          )}
        </>
      )}
    </p>
  );
}
