export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 px-4 dark:bg-slate-900">{children}</div>
  );
}
