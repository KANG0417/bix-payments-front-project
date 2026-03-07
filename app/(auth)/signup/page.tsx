import { SignupForm } from "@features/auth/ui/SignupForm";

export default function SignupPage() {
  return (
    <main className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
      <SignupForm />
    </main>
  );
}
