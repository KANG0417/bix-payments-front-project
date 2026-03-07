export interface LoginRequest {
  username: string; // 이메일 형식
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

const LOGIN_URL = "https://front-mission.bigs.or.kr/auth/signin";

export async function signin(request: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (res.ok) return res.json();

  const data = await res.json().catch(() => null);
  throw new Error(data?.message || "로그인에 실패했습니다.");
}