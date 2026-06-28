import { useQuery } from "@tanstack/react-query";

import { waitlistPredictorApi } from "@/lib/waitlistPredictor";

export function useWaitlistPredictor(
  pnr: string | null,
  enabled: boolean,
  explain = true
) {
  return useQuery({
    queryKey: ["ai", "waitlist-predictor", pnr, explain],
    queryFn: () => waitlistPredictorApi.predict(pnr!, explain),
    enabled: enabled && !!pnr,
    staleTime: 5 * 60 * 1000, // 5 min — prediction is stable within a session
    retry: false, // advisory only; a miss (401 / network) just hides the card
  });
}
