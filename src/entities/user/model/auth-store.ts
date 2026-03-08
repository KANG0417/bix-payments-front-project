"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "./types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

const decodeJwt = (token: string) => {
  try {
    const payload = token.split(".")[1];
    // Base64URL → Base64 변환 추가
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const normalizeAccessToken = (token: string) =>
  token.replace(/^Bearer\s+/i, "").trim();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      setTokens: (accessToken, refreshToken) => {
        const normalizedAccessToken = normalizeAccessToken(accessToken);
        const payload = decodeJwt(normalizedAccessToken);
        const user: AuthUser = {
          id: payload?.username ?? "",
          email: payload?.username ?? "",
          displayName: payload?.name ?? "",
        };
        set({ accessToken: normalizedAccessToken, refreshToken, user });
      },

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "blog-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);