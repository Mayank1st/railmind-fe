import { useQuery } from "@tanstack/react-query";

import { trendingApi } from "@/lib/trending";

// Weekly snapshot (recomputed Sunday 23:50 IST), static in between — no value
// refetching within a visit. Keep fresh for an hour.
const STALE = 60 * 60 * 1000; // 1 hour

export function usePopularDestinations() {
  return useQuery({
    queryKey: ["trending", "popular-destinations"],
    queryFn: () => trendingApi.getPopularDestinations(),
    staleTime: STALE,
  });
}
