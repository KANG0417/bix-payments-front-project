"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";

interface AuthGuardProps {
  children: React.ReactNode;
}

function parseJwtPayload(token: string) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    return JSON.parse(atob(base64)) as { exp?: number };
  } catch {
    return null;
  }
}

function isValidAccessToken(token: string | null) {
  if (!token) return false;
  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  const payload = parseJwtPayload(normalized);
  if (!payload) return false;
  if (!payload.exp) return true;
  return payload.exp * 1000 > Date.now();
}

/**
 * 로그인한 사용자만 자식 페이지를 보여주고, 비로그인 시 로그인 페이지로 리다이렉트
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isHydrated) return;
    if (user === null || !isValidAccessToken(accessToken)) {
      logout();
      router.replace(ROUTES.LOGIN);
    }
  }, [isHydrated, user, accessToken, logout, router]);

  if (!isHydrated || user === null || !isValidAccessToken(accessToken)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  return <>{children}</>;
}
