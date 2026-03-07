"use client";

interface PostCountSummaryProps {
  totalCount: number;
  currentFilterCount: number;
  selectedCategory: string;
}

export function PostCountSummary({
  totalCount,
  currentFilterCount,
  selectedCategory,
}: PostCountSummaryProps) {
  return (
    <p className="text-sm text-slate-600 dark:text-slate-400">
      {selectedCategory === "전체" ? (
        <>전체 글 <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</strong>개</>
      ) : (
        <>
          <strong className="font-semibold text-slate-800 dark:text-slate-200">{selectedCategory}</strong> 글{" "}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">{currentFilterCount}</strong>개
          {totalCount !== currentFilterCount && (
            <span className="ml-1">(전체 {totalCount}개)</span>
          )}
        </>
      )}
    </p>
  );
}
