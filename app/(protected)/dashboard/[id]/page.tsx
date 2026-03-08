"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function DashboardPostDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900">
      <h1 className="mb-2 text-2xl font-bold">게시글 상세</h1>
      <p className="mb-6 text-sm text-amber-800/80">
        선택한 게시글 ID: <span className="font-semibold">{params.id}</span>
      </p>
      <Link
        href="/dashboard"
        className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
      >
        목록으로 돌아가기
      </Link>
    </section>
  );
}
