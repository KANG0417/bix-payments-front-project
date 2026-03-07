import { AuthGuard } from "@widgets/auth/AuthGuard";
import { GlobalNavBar } from "@widgets/layout/GlobalNavBar";
import { FloatingWriteAndScrollTop } from "@features/post-write/ui/FloatingWriteAndScrollTop";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <GlobalNavBar />
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">{children}</main>
        <FloatingWriteAndScrollTop />
      </div>
    </AuthGuard>
  );
}
