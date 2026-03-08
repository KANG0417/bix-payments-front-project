"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 로그인한 사용자만 자식 페이지를 보여주고, 비로그인 시 로그인 페이지로 리다이렉트
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (user === null) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  return <>{children}</>;
}
