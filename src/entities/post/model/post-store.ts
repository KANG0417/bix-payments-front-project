"use client";

import { create } from "zustand";
import type { Post } from "./types";
import { getStorageItem, setStorageItem } from "@shared/lib/storage";
import { STORAGE_KEYS } from "@shared/config/storage-keys";

const POSTS_PER_PAGE = 9;

function loadPosts(): Post[] {
  if (typeof window === "undefined") return [];
  const stored = getStorageItem<Post[]>(STORAGE_KEYS.POSTS);
  return stored ?? [];
}

function savePosts(posts: Post[]) {
  setStorageItem(STORAGE_KEYS.POSTS, posts);
}

interface PostState {
  posts: Post[];
  isHydrated: boolean;
  getPostsByAuthor: (authorId: string) => Post[];
  getFilteredPosts: (authorId: string, category: string, tag: string | null) => Post[];
  addPost: (post: Omit<Post, "id" | "createdAt" | "updatedAt">) => Post;
  getPostsPage: (
    authorId: string,
    category: string,
    tag: string | null,
    page: number
  ) => { items: Post[]; hasMore: boolean };
  getAllTags: (authorId: string) => string[];
  getCountByCategory: (authorId: string, category: string) => number;
  getFilteredCount: (authorId: string, category: string, tag: string | null) => number;
  getTotalCount: (authorId: string) => number;
  hydrate: () => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isHydrated: false,

  hydrate: () => {
    set({ posts: loadPosts(), isHydrated: true });
  },

  getPostsByAuthor: (authorId) => {
    return get().posts
      .filter((p) => p.authorId === authorId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getFilteredPosts: (authorId, category, tag) => {
    let list = get().getPostsByAuthor(authorId);
    if (category && category !== "전체") {
      list = list.filter((p) => p.category === category);
    }
    if (tag) {
      list = list.filter((p) => p.tags.includes(tag));
    }
    return list;
  },

  getPostsPage: (authorId, category, tag, page) => {
    const list = get().getFilteredPosts(authorId, category, tag);
    const start = page * POSTS_PER_PAGE;
    const items = list.slice(start, start + POSTS_PER_PAGE);
    return {
      items,
      hasMore: start + items.length < list.length,
    };
  },

  addPost: (input) => {
    const now = Date.now();
    const post: Post = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const next = [...get().posts, post];
    set({ posts: next });
    savePosts(next);
    return post;
  },

  getAllTags: (authorId) => {
    const set = new Set<string>();
    get()
      .getPostsByAuthor(authorId)
      .forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  },

  getCountByCategory: (authorId, category) => {
    if (category === "전체") return get().getTotalCount(authorId);
    return get().getFilteredPosts(authorId, category, null).length;
  },

  getFilteredCount: (authorId, category, tag) => {
    return get().getFilteredPosts(authorId, category, tag).length;
  },

  getTotalCount: (authorId) => {
    return get().getPostsByAuthor(authorId).length;
  },
}));
