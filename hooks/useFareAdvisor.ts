import { useQuery } from "@tanstack/react-query";

import { fareAdvisorApi, type FareAdvisorParams } from "@/lib/fareAdvisor";

export function useFareAdvisor(params: FareAdvisorParams, enabled: boolean) {
  return useQuery({
    queryKey: [
      "ai",
      "fare-advisor",
      params.train_number,
      params.source_station_code,
      params.destination_station_code,
      params.train_class,
      params.journey_date,
      params.quota ?? "GN",
    ],
    queryFn: () => fareAdvisorApi.advise(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min — advice for a journey is stable within a session
    retry: false, // advisory only; a miss (401 / network) just hides the nudge
  });
}
