"use client";

const KEY = "healthyhub:recently_viewed";
const MAX = 6;

export type ViewedEntry = {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  city: string | null;
  viewed_at: number;
};

export function pushRecentlyViewed(entry: Omit<ViewedEntry, "viewed_at">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: ViewedEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => e.id !== entry.id);
    const next: ViewedEntry[] = [
      { ...entry, viewed_at: Date.now() },
      ...filtered,
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // silent
  }
}

export function getRecentlyViewed(): ViewedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ViewedEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
