"use client";

import Link from "next/link";
import { Post } from "../../model/types";
import { categoryToLabel, type BoardCategory } from "@entities/post/model/category";

interface PostCardProps {
  post: Post;
  href?: string;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PostCard({ post, href }: PostCardProps) {
  const content = typeof post.content === "string" ? post.content : "";
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const categoryLabel = categoryToLabel((post.category as BoardCategory) ?? "ETC");
  const excerpt =
    content.length > 120 ? content.slice(0, 120) + "…" : content;
  const isUpdated = post.isEdited ?? post.updatedAt > post.createdAt;

  return (
    <Link href={href ?? `/dashboard/${post.id}`} className="block">
      <article className="group flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:scale-[1.03] hover:border-amber-200 hover:bg-amber-50 hover:shadow-md focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors duration-200 group-hover:bg-amber-100 group-hover:text-amber-700">
            {categoryLabel}
          </span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 transition-colors duration-200 group-hover:bg-yellow-100 group-hover:text-yellow-700"
            >
              #{tag}
            </span>
          ))}
        </div>
        <h2 className="mb-2 truncate text-lg font-semibold text-slate-900 transition-colors duration-200 group-hover:text-amber-900">
          {post.title}
        </h2>
        <p className="mb-3 flex-1 text-sm leading-relaxed text-slate-600 transition-colors duration-200 group-hover:text-amber-800/80">
          {excerpt}
        </p>
        <div className="flex items-center gap-2">
          <time
            className="text-xs text-slate-500 transition-colors duration-200 group-hover:text-amber-700/70"
            dateTime={new Date(post.createdAt).toISOString()}
          >
            {formatDate(post.createdAt)}
          </time>
          {isUpdated && (
            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
              수정됨
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
