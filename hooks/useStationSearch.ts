import { queryOptions, useQuery } from "@tanstack/react-query";
import { stationApi } from "@/lib/station";
import { useMemo } from "react";

export const stationsQueryOptions = queryOptions({
  queryKey: ["stations", "all"],
  queryFn: () => stationApi.getAll(),
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: 7 * 24 * 60 * 60 * 1000,
});

function useAllStations() {
  return useQuery(stationsQueryOptions);
}

export function useStationSearch(query: string) {
  const { data: allStations, isLoading } = useAllStations();

  const filtered = useMemo(() => {
    if (!allStations || query.length < 2) return [];

    const q = query.toUpperCase();

    return allStations
      .filter(
        (s) =>
          s.station_code.toUpperCase().includes(q) ||
          s.station_name.toUpperCase().includes(q)
      )
      .slice(0, 10);
  }, [allStations, query]);

  return { data: filtered, isLoading };
}
