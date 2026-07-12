import { useQuery } from "@tanstack/react-query";

import { cancellationAdvisorApi } from "@/lib/cancellationAdvisor";

export function useCancellationAdvisor(
  pnr: string | null,
  enabled = true,
  explain = true
) {
  return useQuery({
    queryKey: ["ai", "cancellation-advisor", pnr, explain],
    queryFn: () => cancellationAdvisorApi.getAdvice(pnr!, explain),
    enabled: enabled && !!pnr,
    staleTime: 60 * 1000, // refund windows move with the clock — keep short
    retry: false, // rate-limited (10/min) — don't burn the quota on retries
  });
}
