import { AuthGuard } from "@widgets/auth/AuthGuard";
import { GlobalNavBar } from "@widgets/layout/GlobalNavBar";
import { Footer } from "@widgets/layout/Footer";
import { FloatingWriteAndScrollTop } from "@features/post-write/ui/FloatingWriteAndScrollTop";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
        <GlobalNavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6">{children}</main>
        <Footer />
        <FloatingWriteAndScrollTop />
      </div>
    </AuthGuard>
  );
}
