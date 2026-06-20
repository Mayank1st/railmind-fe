import { useQuery } from "@tanstack/react-query";
import { stationApi } from "@/lib/station";

// The nearby-station cluster for a station code — powers the "CSMT, LTT also
// covered" helper under the Nearby stations toggle.
export function useStationCluster(code: string) {
  return useQuery({
    queryKey: ["station-cluster", code],
    queryFn: () => stationApi.cluster(code),
    enabled: !!code,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
