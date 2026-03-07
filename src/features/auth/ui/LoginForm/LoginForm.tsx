"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";
import { signin } from "@features/auth/api/signin";

export function LoginForm() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { mutate: login, isPending, error, isError } = useMutation({
    mutationFn: signin,
    onSuccess: (data) => {
      console.log('로그인성공!');
      setTokens(data.accessToken, data.refreshToken);
      router.push(ROUTES.DASHBOARD);
    },
  });

  const getErrorMessage = (err: unknown): string => {
    if (!navigator.onLine) return "네트워크 연결을 확인해주세요.";
    const message = (err as Error)?.message ?? "";
    if (message.includes("401") || message.includes("403") || message.includes("invalid") || message.includes("credentials")) {
      return "아이디 또는 비밀번호를 다시 확인해주세요.";
    }
    if (message.includes("404") || message.includes("not found")) {
      return "아이디 또는 비밀번호를 다시 확인해주세요.";
    }
    if (message.includes("500") || message.includes("서버")) {
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
    if (message.includes("fetch") || message.includes("network") || message.includes("Failed")) {
      return "네트워크 연결을 확인해주세요.";
    }
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
    } else {
      setEmailError("");
    }

    if (!password.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (hasError) return;

    login({ username: email, password });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        로그인
      </h1>
      {isError && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {getErrorMessage(error)}
        </p>
      )}
      <Input
        type="email"
        label="이메일"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError("");
        }}
        error={emailError}
        autoComplete="email"
      />
      <Input
        type="password"
        label="비밀번호"
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (passwordError) setPasswordError("");
        }}
        error={passwordError}
        autoComplete="current-password"
      />
      <div className="flex flex-col gap-2">
        <Button type="submit" fullWidth isLoading={isPending}>
          로그인
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => router.push(ROUTES.SIGNUP)}
        >
          회원가입
        </Button>
      </div>
    </form>
  );
}