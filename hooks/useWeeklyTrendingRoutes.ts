import { useQuery } from "@tanstack/react-query";

import { trendingApi } from "@/lib/trending";

// Data is recomputed once a week (Sunday 23:59 IST) and stays static in between,
// so there's no value refetching within a visit — keep it fresh for an hour.
const STALE = 60 * 60 * 1000; // 1 hour

export function useWeeklyTrendingRoutes() {
  return useQuery({
    queryKey: ["trending", "weekly-routes"],
    queryFn: () => trendingApi.getWeeklyRoutes(),
    staleTime: STALE,
  });
}
