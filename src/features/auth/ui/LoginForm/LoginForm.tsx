"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { disassemble, assemble } from "es-hangul";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";
import { signin } from "@features/auth/api/signin";
import { animatedStyles, globalStyles } from "./LoginForm.styles";

const TYPING_TEXT = "안녕하세요";
const JAMOS = disassemble(TYPING_TEXT).split("");

export function LoginForm() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [petals, setPetals] = useState<
    Array<{
      id: number;
      x: number;
      size: number;
      duration: number;
      delay: number;
      rotate: number;
      drift: number;
      opacity: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    const PETAL_COLORS = [
      "#ffc8dd",
      "#ffafcc",
      "#f9c6d0",
      "#fadadd",
      "#fbb8c8",
      "#f8d7da",
      "#fce4ec",
      "#f48fb1",
    ];
    setPetals(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 14 + 8,
        duration: Math.random() * 6 + 7,
        delay: Math.random() * 12,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 180,
        opacity: Math.random() * 0.45 + 0.4,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      })),
    );
  }, []);

  const [jamoIndex, setJamoIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const displayed = jamoIndex === 0 ? "" : assemble(JAMOS.slice(0, jamoIndex));

  useEffect(() => {
    if (isPaused) return;
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (jamoIndex < JAMOS.length) {
            setJamoIndex((i) => i + 1);
          } else {
            setIsPaused(true);
            setTimeout(() => {
              setIsPaused(false);
              setIsDeleting(true);
            }, 1800);
          }
        } else {
          if (jamoIndex > 0) {
            setJamoIndex((i) => i - 1);
          } else {
            setIsPaused(true);
            setTimeout(() => {
              setIsPaused(false);
              setIsDeleting(false);
            }, 500);
          }
        }
      },
      isDeleting ? 60 : 120,
    );
    return () => clearTimeout(timeout);
  }, [jamoIndex, isDeleting, isPaused]);

  const {
    mutate: login,
    isPending,
    error,
    isError,
  } = useMutation({
    mutationFn: signin,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      router.push(ROUTES.DASHBOARD);
    },
  });

  const getErrorMessage = (err: unknown): string => {
    if (!navigator.onLine) return "네트워크 연결을 확인해주세요.";
    const message = (err as Error)?.message ?? "";
    if (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("invalid") ||
      message.includes("credentials")
    )
      return "아이디 또는 비밀번호를 다시 확인해주세요.";
    if (message.includes("404") || message.includes("not found"))
      return "아이디 또는 비밀번호를 다시 확인해주세요.";
    if (message.includes("500") || message.includes("서버"))
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("Failed")
    )
      return "네트워크 연결을 확인해주세요.";
    return "아이디 또는 비밀번호를 다시 확인해주세요.";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!email.trim()) {
      setEmailError("이메일을 입력해주세요.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("올바른 이메일 형식을 입력해주세요.");
      hasError = true;
    } else setEmailError("");
    if (!password.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
      hasError = true;
    } else setPasswordError("");
    if (hasError) return;
    login({ username: email, password });
  };

  return (
    <>
      <style>{globalStyles}</style>

      {/* 봄 배경 */}
      <div style={animatedStyles.springBg} aria-hidden="true" />

      {/* 벚꽃잎 */}
      {petals.map((p) => (
        <div
          key={p.id}
          aria-hidden="true"
          style={
            {
              ...animatedStyles.petal,
              left: `${p.x}%`,
              width: p.size,
              height: p.size * 0.75,
              backgroundColor: p.color,
              opacity: p.opacity,
              animation: `petalFall ${p.duration}s ease-in ${p.delay}s infinite, sway ${p.duration * 0.45}s ease-in-out infinite alternate`,
              ["--drift" as string]: `${p.drift}px`,
              ["--rotate" as string]: `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}

      <main className="relative z-20 flex w-full items-center justify-center px-4 py-12">
        <article
          className="w-full max-w-[440px]"
          style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          <header className="mb-8 text-center">
            <figure
              aria-label="커뮤니티 로고"
              className="mx-auto mb-4 inline-flex h-14 min-w-[96px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f48fb1] to-[#ce93d8] px-3 text-lg font-black tracking-tight text-white shadow-[0_8px_24px_rgba(244,143,177,0.45)]"
            >
              CO.KR
            </figure>
            <h1 className="m-0 min-h-[1.2em] text-[clamp(26px,5vw,34px)] font-black text-[#7b2d52]">
              {displayed}
              <span style={animatedStyles.cursor} aria-hidden="true" />
              🌸
            </h1>
            <p className="mt-2 text-[clamp(14px,3vw,16px)] text-[#b06080]">
              로그인해서 글을 작성해보세요.
            </p>
          </header>

          <section className="rounded-[28px] border-[1.5px] border-[rgba(255,198,218,0.6)] bg-[rgba(255,255,255,0.85)] p-[clamp(28px,5vw,44px)] shadow-[0_20px_60px_rgba(244,143,177,0.2),0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-[24px]">
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="로그인 폼"
              className="flex flex-col gap-5"
            >
              {isError && (
                <output
                  role="alert"
                  aria-live="polite"
                  className="flex items-center gap-2.5 rounded-xl border border-[#ffcdd2] bg-[#fff0f3] px-4 py-3 text-sm font-medium text-[#c62828]"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {getErrorMessage(error)}
                </output>
              )}

              <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
                <label
                  htmlFor="email"
                  className="text-sm font-bold text-[#7b2d52]"
                >
                  이메일
                </label>
                <div className="group relative">
                  <input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    value={email}
                    placeholder="example@email.com"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    className={`box-border w-full rounded-xl bg-[#fff9fb] py-[13px] pl-4 pr-11 text-[15px] text-[#4a2030] outline-none transition-all ${
                      emailError
                        ? "border-[1.5px] border-[#f44336]"
                        : "border-[1.5px] border-[#f9c6d0]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("");
                      setEmailError("");
                      emailInputRef.current?.focus();
                    }}
                    disabled={email.length === 0}
                    aria-label="이메일 전체 삭제"
                    className="absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[#f3d6df] bg-white text-sm text-[#c9a0b0] opacity-0 transition hover:bg-[#fff4f8] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                  >
                    x
                  </button>
                </div>
                {emailError && (
                  <small
                    id="email-error"
                    role="alert"
                    className="text-xs font-medium text-[#e53935]"
                  >
                    {emailError}
                  </small>
                )}
              </fieldset>

              <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-[#7b2d52]"
                >
                  비밀번호
                </label>
                <div className="group relative">
                  <input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    aria-required="true"
                    aria-invalid={!!passwordError}
                    aria-describedby={
                      passwordError ? "password-error" : undefined
                    }
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    className={`box-border w-full rounded-xl bg-[#fff9fb] py-[13px] pl-4 pr-20 text-[15px] text-[#4a2030] outline-none transition-all ${
                      passwordError
                        ? "border-[1.5px] border-[#f44336]"
                        : "border-[1.5px] border-[#f9c6d0]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPassword("");
                      setPasswordError("");
                      passwordInputRef.current?.focus();
                    }}
                    disabled={password.length === 0}
                    aria-label="비밀번호 전체 삭제"
                    className="absolute right-10 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[#f3d6df] bg-white text-sm text-[#c9a0b0] opacity-0 transition hover:bg-[#fff4f8] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                  >
                    x
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                    className="absolute right-3.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-none bg-transparent p-0 text-[#c9a0b0]"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <small
                    id="password-error"
                    role="alert"
                    className="text-xs font-medium text-[#e53935]"
                  >
                    {passwordError}
                  </small>
                )}
              </fieldset>

              <div className="mt-1 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                  className={`w-full rounded-xl border-none px-3.5 py-[14px] text-base font-bold text-white shadow-[0_6px_20px_rgba(244,143,177,0.45)] transition-all ${
                    isPending
                      ? "cursor-not-allowed bg-gradient-to-br from-[#f48fb1] to-[#ce93d8] opacity-60"
                      : "cursor-pointer bg-gradient-to-br from-[#f48fb1] to-[#ce93d8]"
                  }`}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="inline-block animate-spin"
                        aria-hidden="true"
                        width="18"
                        height="18"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          style={{ opacity: 0.25 }}
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          style={{ opacity: 0.75 }}
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                    </span>
                  ) : (
                    "로그인"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.SIGNUP)}
                  className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#f9c6d0] bg-[rgba(244,143,177,0.08)] px-3.5 py-[14px] text-base font-semibold text-[#b06080] transition-all"
                >
                  회원가입
                </button>
              </div>
            </form>
          </section>

          <footer className="mt-6 text-center">
            <small className="text-[13px] text-[#c084a0]">
              오늘도 좋은 하루 되세요 🌷
            </small>
          </footer>
        </article>
      </main>
    </>
  );
}
