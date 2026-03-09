import { useAuthStore } from "@entities/user/model/auth-store";

const REFRESH_URL = "https://front-mission.bigs.or.kr/auth/refresh";

interface RefreshResponse {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

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

function getRefreshToken() {
  const fromStore = normalizeToken(useAuthStore.getState().refreshToken);
  if (fromStore) return fromStore;
  return normalizeToken(getPersistedTokens()?.refreshToken ?? null);
}

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().setSessionExpired(true);
      throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
    }

    // 서버 구현 차이를 고려해 refresh 요청 포맷을 순차 시도
    const attempts: RequestInit[] = [
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      },
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      },
    ];

    let res: Response | null = null;
    for (const attempt of attempts) {
      res = await fetch(REFRESH_URL, attempt);
      if (res.ok) break;
      // refresh token 자체가 만료/무효면 추가 포맷 시도 없이 종료
      if (res.status === 401) break;
    }

    if (!res || !res.ok) {
      useAuthStore.getState().logout();
      useAuthStore.getState().setSessionExpired(true);
      throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
    }

    const data = (await res.json().catch(() => ({}))) as RefreshResponse;
    const nextAccessToken = normalizeToken(data.accessToken ?? data.token ?? null);
    const nextRefreshToken = normalizeToken(data.refreshToken ?? refreshToken);

    if (!nextAccessToken || !nextRefreshToken) {
      useAuthStore.getState().logout();
      useAuthStore.getState().setSessionExpired(true);
      throw new Error("세션 갱신에 실패했습니다. 다시 로그인해주세요.");
    }

    useAuthStore.getState().setTokens(nextAccessToken, nextRefreshToken);
    useAuthStore.getState().setSessionExpired(false);
    return nextAccessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
