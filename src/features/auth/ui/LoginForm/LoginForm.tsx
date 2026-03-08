"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { disassemble, assemble } from "es-hangul";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";
import { signin } from "@features/auth/api/signin";
import { globalStyles, styles } from "./LoginForm.styles";

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
      <div style={styles.springBg} aria-hidden="true" />

      {/* 벚꽃잎 */}
      {petals.map((p) => (
        <div
          key={p.id}
          aria-hidden="true"
          style={
            {
              ...styles.petal,
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

      <main style={styles.main}>
        <article style={styles.article}>
          <header style={styles.header}>
            <figure aria-label="블로그 로고" style={styles.logo}>
              B
            </figure>
            <h1 style={styles.h1}>
              {displayed}
              <span style={styles.cursor} aria-hidden="true" />
              🌸
            </h1>
            <p style={styles.subtitle}>내 블로그에 로그인하세요</p>
          </header>

          <section style={styles.card}>
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="로그인 폼"
              style={styles.form}
            >
              {isError && (
                <output role="alert" aria-live="polite" style={styles.errorBox}>
                  <svg
                    aria-hidden="true"
                    style={{ width: 16, height: 16, flexShrink: 0 }}
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

              <fieldset style={styles.fieldset}>
                <label htmlFor="email" style={styles.label}>
                  이메일
                </label>
                <input
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
                  style={emailError ? styles.inputError : styles.input}
                />
                {emailError && (
                  <small id="email-error" role="alert" style={styles.errorText}>
                    {emailError}
                  </small>
                )}
              </fieldset>

              <fieldset style={styles.fieldset}>
                <label htmlFor="password" style={styles.label}>
                  비밀번호
                </label>
                <div style={styles.inputWrap}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="••••••••"
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
                    style={
                      passwordError
                        ? styles.inputPasswordError
                        : styles.inputPassword
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                    style={styles.eyeButton}
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
                    style={styles.errorText}
                  >
                    {passwordError}
                  </small>
                )}
              </fieldset>

              <div style={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                  style={
                    isPending ? styles.btnPrimaryDisabled : styles.btnPrimary
                  }
                >
                  {isPending ? (
                    <span style={styles.spinnerWrap}>
                      <svg
                        style={styles.spinner}
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
                  style={styles.btnSecondary}
                >
                  회원가입
                </button>
              </div>
            </form>
          </section>

          <footer style={styles.footer}>
            <small style={styles.footerText}>오늘도 좋은 하루 되세요 🌷</small>
          </footer>
        </article>
      </main>
    </>
  );
}
