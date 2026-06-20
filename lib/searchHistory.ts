import { api } from "./api";

export type RecentSearch = {
  id: string;
  source: { code: string; name: string };
  destination: { code: string; name: string };
  journey_date: string | null;
  train_class: string | null;
  quota: string | null;
  searched_at: string;
};

export const searchHistoryApi = {
  // GET /search-history/recent — auth required (guests get 401).
  recent: (limit = 6) =>
    api
      .get<{ data: RecentSearch[] }>("/search-history/recent", {
        params: { limit },
      })
      .then((r) => r.data.data ?? []),
};

// ── Guest recents (localStorage) — the backend only logs for logged-in users,
// so we keep an equivalent list on-device for guests. ──────────────────────
const GUEST_KEY = "rm_recent_searches";

export function readGuestRecents(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

export function pushGuestRecent(entry: {
  source: { code: string; name: string };
  destination: { code: string; name: string };
  journey_date?: string | null;
  train_class?: string | null;
  quota?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const routeKey = `${entry.source.code}-${entry.destination.code}`;
  const others = readGuestRecents().filter(
    (e) => `${e.source.code}-${e.destination.code}` !== routeKey
  );
  const next: RecentSearch = {
    id: routeKey,
    source: entry.source,
    destination: entry.destination,
    journey_date: entry.journey_date ?? null,
    train_class: entry.train_class ?? null,
    quota: entry.quota ?? null,
    searched_at: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(
      GUEST_KEY,
      JSON.stringify([next, ...others].slice(0, 20))
    );
  } catch {
    // storage full / disabled — ignore
  }
}
