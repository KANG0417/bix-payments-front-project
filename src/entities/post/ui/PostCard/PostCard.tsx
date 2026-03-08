"use client";

import { Post } from "../../model/types";

interface PostCardProps {
  post: Post;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PostCard({ post }: PostCardProps) {
  const excerpt =
    post.content.length > 120 ? post.content.slice(0, 120) + "…" : post.content;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {post.category}
        </span>
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-600 dark:text-slate-300"
          >
            #{tag}
          </span>
        ))}
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {post.title}
      </h2>
      <p className="mb-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {excerpt}
      </p>
      <time
        className="text-xs text-slate-500 dark:text-slate-500"
        dateTime={new Date(post.createdAt).toISOString()}
      >
        {formatDate(post.createdAt)}
      </time>
    </article>
  );
}
