"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";

export function GlobalNavBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.replace(ROUTES.LOGIN);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.displayName ? user.displayName.slice(0, 2) : "?";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
        {/* 로고 */}
        <Link
          href={ROUTES.DASHBOARD}
          className="group flex cursor-pointer items-center gap-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white transition-transform group-hover:scale-110 dark:bg-white dark:text-zinc-900">
            B
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            내 블로그
          </span>
        </Link>

        {/* 우측 액션 */}
        {user && (
          <div className="flex items-center gap-4">
            {/* 글쓰기 버튼 */}
            <Link
              href={ROUTES.POST_WRITE}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-700 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              글쓰기
            </Link>

            {/* 구분선 */}
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

            {/* 프로필 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex cursor-pointer items-center gap-2.5 rounded-full p-1 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shadow-sm">
                  {initials}
                </div>
                <span className="hidden text-sm font-semibold text-zinc-700 dark:text-zinc-300 sm:block">
                  {user.displayName}
                </span>
                {/* 화살표 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`hidden h-4 w-4 text-zinc-400 transition-transform sm:block ${dropdownOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  {/* 유저 정보 */}
                  <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-700">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.displayName}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">{user.email}</p>
                  </div>
                  {/* 로그아웃 */}
                  <button
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}