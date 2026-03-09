import axios from "axios";
import { useAuthStore } from "@entities/user/model/auth-store";

const REFRESH_URL = process.env.NEXT_PUBLIC_AUTH_REFRESH_PATH;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_STORE_KEY = "blog-auth";

interface RefreshResponse {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
}

type RefreshAttempt = {
  headers?: Record<string, string>;
  body?: Record<string, string>;
};

function normalizeToken(token?: string | null) {
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, "").trim();
}

function getPersistedTokens() {
  if (typeof window === "undefined") return null;

  try {
    const persisted = window.localStorage.getItem(AUTH_STORE_KEY);
    if (!persisted) return null;

    const parsed = JSON.parse(persisted) as {
      state?: { accessToken?: string | null; refreshToken?: string | null };
    };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

function persistTokensToLocalStorage(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(AUTH_STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      state?: Record<string, unknown>;
      version?: number;
    };
    const next = {
      ...parsed,
      state: {
        ...(parsed.state ?? {}),
        accessToken,
        refreshToken,
        sessionExpired: false,
      },
    };
    window.localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
  } catch {
    // no-op
  }
}

function getRefreshToken() {
  const fromStore = normalizeToken(useAuthStore.getState().refreshToken);
  if (fromStore) return fromStore;
  return normalizeToken(getPersistedTokens()?.refreshToken ?? null);
}

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    let refreshUrl = String(REFRESH_URL ?? "").trim();
    const baseUrl = String(API_BASE_URL ?? "").trim().replace(/\/$/, "");

    // .env에 ${NEXT_PUBLIC_API_BASE_URL}/auth/refresh 형태로 들어온 경우 런타임 보정
    if (refreshUrl.includes("${NEXT_PUBLIC_API_BASE_URL}") && baseUrl) {
      refreshUrl = refreshUrl.replace("${NEXT_PUBLIC_API_BASE_URL}", baseUrl);
    }

    // path만 들어온 경우(base + path)로 결합
    if (refreshUrl.startsWith("/") && baseUrl) {
      refreshUrl = `${baseUrl}${refreshUrl}`;
    }

    if (!refreshUrl) {
      throw new Error("NEXT_PUBLIC_AUTH_REFRESH_PATH 환경변수가 필요합니다.");
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().setSessionExpired(true);
      throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
    }

    // 서버 구현 차이를 고려해 refresh 요청 포맷을 순차 시도
    const attempts: RefreshAttempt[] = [
      {
        headers: { Authorization: `Bearer ${refreshToken}` },
        body: { refreshToken },
      },
      {
        headers: { Authorization: refreshToken },
        body: { refreshToken },
      },
      {
        headers: { "Content-Type": "application/json" },
        body: { refreshToken },
      },
      {
        headers: { "Content-Type": "application/json" },
        body: { token: refreshToken },
      },
      {
        headers: { "Content-Type": "application/json" },
        body: { refresh_token: refreshToken },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        body: { refreshToken },
      },
    ];

    let responseData: RefreshResponse | null = null;
    let responseHeaders: Record<string, string | undefined> = {};
    let status = 0;
    for (const attempt of attempts) {
      const requestBody = attempt.body ?? { refreshToken };
      const res = await axios.post<RefreshResponse>(refreshUrl, requestBody, {
        headers: attempt.headers,
        validateStatus: () => true,
      });
      status = res.status;
      if (res.status >= 200 && res.status < 300) {
        responseData = res.data;
        responseHeaders = res.headers as Record<string, string | undefined>;
        break;
      }
    }

    if (!responseData) {
      useAuthStore.getState().logout();
      useAuthStore.getState().setSessionExpired(true);
      if (status === 401) {
        throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
      }
      throw new Error("세션 갱신에 실패했습니다. 다시 로그인해주세요.");
    }

    const nextAccessToken = normalizeToken(
      responseData.accessToken ??
        responseData.access_token ??
        responseData.token ??
        responseHeaders.authorization ??
        responseHeaders["access-token"] ??
        responseHeaders["x-access-token"] ??
        null,
    );
    const nextRefreshToken = normalizeToken(
      responseData.refreshToken ??
        responseData.refresh_token ??
        responseHeaders["refresh-token"] ??
        responseHeaders["x-refresh-token"] ??
        refreshToken,
    );

    if (!nextAccessToken || !nextRefreshToken) {
      useAuthStore.getState().logout();
      useAuthStore.getState().setSessionExpired(true);
      throw new Error("세션 갱신에 실패했습니다. 다시 로그인해주세요.");
    }

    useAuthStore.getState().setTokens(nextAccessToken, nextRefreshToken);
    persistTokensToLocalStorage(nextAccessToken, nextRefreshToken);
    useAuthStore.getState().setSessionExpired(false);
    return nextAccessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
