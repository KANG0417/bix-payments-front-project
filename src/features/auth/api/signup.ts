export interface SignupRequest {
  username: string; // 이메일 형식
  name: string;
  password: string;
  confirmPassword: string;
}

export type SignupFieldErrors = Record<string, string[]>;

export class SignupApiError extends Error {
  fieldErrors?: SignupFieldErrors;

  constructor(message: string, fieldErrors?: SignupFieldErrors) {
    super(message);
    this.name = "SignupApiError";
    this.fieldErrors = fieldErrors;
  }
}

const SIGNUP_URL = "https://front-mission.bigs.or.kr/auth/signup";

function firstFieldError(fieldErrors?: SignupFieldErrors): string | null {
  if (!fieldErrors) return null;
  for (const v of Object.values(fieldErrors)) {
    if (Array.isArray(v) && v.length > 0) return v[0] ?? null;
  }
  return null;
}

export async function signup(request: SignupRequest): Promise<void> {
  const res = await fetch(SIGNUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (res.ok) return;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await res.json().catch(() => null)) as unknown;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const fieldErrors = data as SignupFieldErrors;
      const message = firstFieldError(fieldErrors) ?? "회원가입에 실패했습니다.";
      throw new SignupApiError(message, fieldErrors);
    }
  }

  const text = await res.text().catch(() => "");
  throw new SignupApiError(text || "회원가입에 실패했습니다.");
}

