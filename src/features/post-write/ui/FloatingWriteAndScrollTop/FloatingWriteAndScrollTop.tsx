"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@shared/config/routes";

const SCROLL_THRESHOLD = 400;

export function FloatingWriteAndScrollTop() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > SCROLL_THRESHOLD);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
      {showScrollTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg transition hover:bg-slate-600 dark:bg-slate-500 dark:hover:bg-slate-400"
          aria-label="맨 위로"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      ) : null}
      <Link
        href={ROUTES.POST_WRITE}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500"
        aria-label="글쓰기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </Link>
    </div>
  );
}
