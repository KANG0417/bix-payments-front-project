import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@entities/user/model/auth-store";
import { refreshAccessToken } from "@features/auth/api/refresh";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://front-mission.bigs.or.kr"
).replace(/\/$/, "");

function normalizeToken(token?: string | null) {
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, "").trim();
}

function getPersistedTokens() {
  if (typeof window === "undefined") return null;
  try {
    const persisted = window.localStorage.getItem("blog-auth");
    if (!persisted) return null;
    const parsed = JSON.parse(persisted) as {
      state?: { accessToken?: string | null; refreshToken?: string | null };
    };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

function getAccessToken() {
  const fromStore = normalizeToken(useAuthStore.getState().accessToken);
  if (fromStore) return fromStore;
  return normalizeToken(getPersistedTokens()?.accessToken ?? null);
}

function getRefreshToken() {
  const fromStore = normalizeToken(useAuthStore.getState().refreshToken);
  if (fromStore) return fromStore;
  return normalizeToken(getPersistedTokens()?.refreshToken ?? null);
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const authApi = axios.create({
  baseURL: BASE_URL,
});

authApi.interceptors.request.use(async (config) => {
  let accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken && refreshToken) {
    try {
      accessToken = await refreshAccessToken();
    } catch {
      // refreshAccessToken에서 세션 만료 상태를 처리한다.
    }
  }

  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }

  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = error.config as RetriableRequestConfig | undefined;
    const hasRefreshToken = !!getRefreshToken();

    if (!originalConfig || status !== 401 || originalConfig._retry || !hasRefreshToken) {
      if (status === 401) {
        useAuthStore.getState().setSessionExpired(true);
      }
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    try {
      const renewedAccessToken = await refreshAccessToken();
      const headers = AxiosHeaders.from(originalConfig.headers ?? {});
      headers.set("Authorization", `Bearer ${renewedAccessToken}`);
      originalConfig.headers = headers;
      return authApi(originalConfig);
    } catch (refreshError) {
      useAuthStore.getState().setSessionExpired(true);
      return Promise.reject(refreshError);
    }
  },
);
