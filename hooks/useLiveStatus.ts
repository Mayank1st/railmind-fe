import { useQuery } from "@tanstack/react-query";
import { liveApi } from "@/lib/live";

// Live train status — polls every minute so the position/delays stay fresh
// while the page is open.
export function useLiveStatus(trainNumber: string, journeyDate: string) {
  return useQuery({
    queryKey: ["live-status", trainNumber, journeyDate],
    queryFn: () => liveApi.status(trainNumber, journeyDate),
    enabled: !!trainNumber && !!journeyDate,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
