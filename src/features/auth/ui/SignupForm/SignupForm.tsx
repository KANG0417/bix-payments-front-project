"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ROUTES } from "@shared/config/routes";
import { signup, SignupApiError } from "../../api/signup";
import { animatedStyles, globalStyles } from "./SignupForm.styles";
import { usePetals } from "../hooks/usePetals";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const petals = usePetals(28);

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      router.push(ROUTES.SIGNIN);
    },
    onError: (err) => {
      if (err instanceof SignupApiError) {
        setFormError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
        return;
      }
      setFormError("회원가입에 실패했습니다.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const username = email.trim();
    const name = displayName.trim() || username;
    const pw = password;
    const cpw = confirmPassword;

    if (pw !== cpw) {
      setFieldErrors({ confirmPassword: ["비밀번호가 일치하지 않습니다."] });
      return;
    }

    signupMutation.mutate({
      username,
      name,
      password: pw,
      confirmPassword: cpw,
    });
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={animatedStyles.springBg} aria-hidden="true" />

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
          className="w-full max-w-[460px]"
          style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          <header className="mb-8 text-center">
            <figure
              aria-label="커뮤니티 로고"
              className="mx-auto mb-4 inline-flex h-14 min-w-[96px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f48fb1] to-[#ce93d8] px-3 text-lg font-black tracking-tight text-white shadow-[0_8px_24px_rgba(244,143,177,0.45)]"
            >
              CO.KR
            </figure>
            <h1 className="m-0 text-[clamp(26px,5vw,34px)] font-black text-[#7b2d52]">
              회원가입
            </h1>
            <p className="mt-2 text-[clamp(14px,3vw,16px)] text-[#b06080]">
            🌸 가입한 봄날에 글이나 한 번 써볼래요? 🌸
            </p>
          </header>

          <section className="rounded-[28px] border-[1.5px] border-[rgba(255,198,218,0.6)] bg-[rgba(255,255,255,0.85)] p-[clamp(28px,5vw,44px)] shadow-[0_20px_60px_rgba(244,143,177,0.2),0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-[24px]">
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="회원가입 폼"
              className="flex flex-col gap-5"
            >
              {formError ? (
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
                  {formError}
                </output>
              ) : null}

              <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
                <label htmlFor="email" className="text-sm font-bold text-[#7b2d52]">
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
                    aria-invalid={!!fieldErrors.username?.[0]}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`box-border w-full rounded-xl bg-[#fff9fb] py-[13px] pl-4 pr-11 text-[15px] text-[#4a2030] outline-none transition-all ${
                      fieldErrors.username?.[0]
                        ? "border-[1.5px] border-[#f44336]"
                        : "border-[1.5px] border-[#f9c6d0]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("");
                      emailInputRef.current?.focus();
                    }}
                    disabled={email.length === 0}
                    aria-label="이메일 전체 삭제"
                    className="absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[#f3d6df] bg-white text-sm text-[#c9a0b0] opacity-0 transition hover:bg-[#fff4f8] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                  >
                    x
                  </button>
                </div>
                {fieldErrors.username?.[0] ? (
                  <small className="text-xs font-medium text-[#e53935]">
                    {fieldErrors.username[0]}
                  </small>
                ) : null}
              </fieldset>

              <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
                <label htmlFor="displayName" className="text-sm font-bold text-[#7b2d52]">
                  닉네임
                </label>
                <div className="group relative">
                  <input
                    ref={nameInputRef}
                    id="displayName"
                    type="text"
                    value={displayName}
                    placeholder="닉네임"
                    autoComplete="name"
                    aria-invalid={!!fieldErrors.name?.[0]}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`box-border w-full rounded-xl bg-[#fff9fb] py-[13px] pl-4 pr-11 text-[15px] text-[#4a2030] outline-none transition-all ${
                      fieldErrors.name?.[0]
                        ? "border-[1.5px] border-[#f44336]"
                        : "border-[1.5px] border-[#f9c6d0]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName("");
                      nameInputRef.current?.focus();
                    }}
                    disabled={displayName.length === 0}
                    aria-label="닉네임 전체 삭제"
                    className="absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[#f3d6df] bg-white text-sm text-[#c9a0b0] opacity-0 transition hover:bg-[#fff4f8] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                  >
                    x
                  </button>
                </div>
                {fieldErrors.name?.[0] ? (
                  <small className="text-xs font-medium text-[#e53935]">
                    {fieldErrors.name[0]}
                  </small>
                ) : null}
              </fieldset>

              <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
                <label htmlFor="password" className="text-sm font-bold text-[#7b2d52]">
                  비밀번호
                </label>
                <div className="group relative">
                  <input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.password?.[0]}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`box-border w-full rounded-xl bg-[#fff9fb] py-[13px] pl-4 pr-20 text-[15px] text-[#4a2030] outline-none transition-all ${
                      fieldErrors.password?.[0]
                        ? "border-[1.5px] border-[#f44336]"
                        : "border-[1.5px] border-[#f9c6d0]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPassword("");
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
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
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
                {fieldErrors.password?.[0] ? (
                  <small className="text-xs font-medium text-[#e53935]">
                    {fieldErrors.password[0]}
                  </small>
                ) : null}
              </fieldset>

              <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-bold text-[#7b2d52]"
                >
                  비밀번호 확인
                </label>
                <div className="group relative">
                  <input
                    ref={confirmPasswordInputRef}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    required
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.confirmPassword?.[0]}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`box-border w-full rounded-xl bg-[#fff9fb] py-[13px] pl-4 pr-20 text-[15px] text-[#4a2030] outline-none transition-all ${
                      fieldErrors.confirmPassword?.[0]
                        ? "border-[1.5px] border-[#f44336]"
                        : "border-[1.5px] border-[#f9c6d0]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmPassword("");
                      confirmPasswordInputRef.current?.focus();
                    }}
                    disabled={confirmPassword.length === 0}
                    aria-label="비밀번호 확인 전체 삭제"
                    className="absolute right-10 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-[#f3d6df] bg-white text-sm text-[#c9a0b0] opacity-0 transition hover:bg-[#fff4f8] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                  >
                    x
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? "비밀번호 확인 숨기기"
                        : "비밀번호 확인 보기"
                    }
                    className="absolute right-3.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-none bg-transparent p-0 text-[#c9a0b0]"
                  >
                    {showConfirmPassword ? (
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
                {fieldErrors.confirmPassword?.[0] ? (
                  <small className="text-xs font-medium text-[#e53935]">
                    {fieldErrors.confirmPassword[0]}
                  </small>
                ) : null}
              </fieldset>

              <div className="mt-1 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  aria-busy={signupMutation.isPending}
                  className={`w-full rounded-xl border-none px-3.5 py-[14px] text-base font-bold text-white shadow-[0_6px_20px_rgba(244,143,177,0.45)] transition-all ${
                    signupMutation.isPending
                      ? "cursor-not-allowed bg-gradient-to-br from-[#f48fb1] to-[#ce93d8] opacity-60"
                      : "cursor-pointer bg-gradient-to-br from-[#f48fb1] to-[#ce93d8]"
                  }`}
                >
                  {signupMutation.isPending ? "가입 중..." : "가입하기"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.SIGNIN)}
                  disabled={signupMutation.isPending}
                  className="w-full cursor-pointer rounded-xl border-[1.5px] border-[#f9c6d0] bg-[rgba(244,143,177,0.08)] px-3.5 py-[14px] text-base font-semibold text-[#b06080] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  로그인으로 돌아가기
                </button>
              </div>
            </form>
          </section>

          <footer className="mt-6 text-center">
            <small className="text-[13px] text-[#c084a0]">
              가입 후 커뮤니티를 함께 만들어가요 🌷
            </small>
          </footer>
        </article>
      </main>
    </>
  );
}
