"use client";

export function LoadingBar() {
  return (
    <div className="fixed left-0 top-0 z-[100] h-1 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
      <div
        className="h-full animate-loading-bar bg-slate-600 dark:bg-slate-400"
        style={{ width: "30%" }}
      />
    </div>
  );
}
