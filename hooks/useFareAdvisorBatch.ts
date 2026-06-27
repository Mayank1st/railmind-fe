import { useQuery } from "@tanstack/react-query";

import { fareAdvisorApi, type FareAdvisorBatchItem } from "@/lib/fareAdvisor";

export function useFareAdvisorBatch(
  items: FareAdvisorBatchItem[],
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      "ai",
      "fare-advisor-batch",
      items.map(
        (i) =>
          `${i.train_number}|${i.train_class}|${i.journey_date}|${i.quota ?? "GN"}`
      ),
    ],
    queryFn: () => fareAdvisorApi.adviseBatch(items),
    enabled: enabled && items.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min — pairs with the ~60s server cache
    retry: false, // advisory; a miss just hides the badges
  });
}
