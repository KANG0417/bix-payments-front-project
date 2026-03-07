"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { ROUTES } from "@shared/config/routes";
import { signup, SignupApiError } from "../../api/signup";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      router.push(ROUTES.LOGIN);
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
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        회원가입
      </h1>
      {formError ? (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {formError}
        </p>
      ) : null}
      <Input
        type="email"
        label="이메일"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        error={fieldErrors.username?.[0]}
      />
      <Input
        type="text"
        label="닉네임"
        placeholder="닉네임"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        autoComplete="name"
        error={fieldErrors.name?.[0]}
      />
      <Input
        type="password"
        label="비밀번호"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        error={fieldErrors.password?.[0]}
      />
      <Input
        type="password"
        label="비밀번호 확인"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        error={fieldErrors.confirmPassword?.[0]}
      />
      <div className="flex flex-col gap-2">
        <Button type="submit" fullWidth isLoading={signupMutation.isPending}>
          가입하기
        </Button>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => router.push(ROUTES.LOGIN)}
          disabled={signupMutation.isPending}
        >
          로그인으로 돌아가기
        </Button>
      </div>
    </form>
  );
}
