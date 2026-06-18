import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { trainSearchApi, type TrainSearchPayload } from "@/lib/train";

export function useTrainSearch(payload: TrainSearchPayload | null) {
  return useQuery({
    queryKey: ["trains", "search", payload],
    queryFn: () => trainSearchApi.trainSearch(payload!),
    enabled: !!payload,
    // Keep the current page on screen while the next page loads.
    placeholderData: keepPreviousData,
  });
}
