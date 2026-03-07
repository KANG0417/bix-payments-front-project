"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@shared/ui/Button";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";

export function GlobalNavBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={ROUTES.DASHBOARD}
          className="text-lg font-semibold text-slate-800 dark:text-slate-100"
        >
          내 블로그
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-600 dark:text-slate-400 sm:inline">
                {user.displayName}
              </span>
              <Link href={ROUTES.POST_WRITE}>
                <Button variant="primary" type="button">
                  글쓰기
                </Button>
              </Link>
              <Button variant="ghost" type="button" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
