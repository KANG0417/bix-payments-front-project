import { LoginForm } from "@features/auth/ui/LoginForm";

export default function LoginPage() {
  return (
    <main className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
      <LoginForm />
    </main>
  );
}
