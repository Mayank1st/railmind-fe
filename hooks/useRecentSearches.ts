import { useQuery } from "@tanstack/react-query";
import { searchHistoryApi } from "@/lib/searchHistory";

// Recent searches for logged-in users (the backend logs them automatically on
// search). Disabled for guests — the caller falls back to localStorage.
export function useRecentSearches(enabled: boolean) {
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: () => searchHistoryApi.recent(6),
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}
