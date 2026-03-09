interface FooterProps {
  maxWidthClassName?: string;
}

export function Footer({ maxWidthClassName = "max-w-5xl" }: FooterProps) {
  return (
    <footer className="px-4 py-8">
      <div
        className={`mx-auto w-full ${maxWidthClassName} border-t border-slate-200 pt-5 text-center text-xs font-semibold text-slate-500`}
      >
        © kang
      </div>
    </footer>
  );
}
