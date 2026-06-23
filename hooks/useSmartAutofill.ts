import { useQuery } from "@tanstack/react-query";

import { autofillApi, type SmartAutofillParams } from "@/lib/autofill";

/**
 * Fetches Smart Form Autofill suggestions for the chosen train + route.
 *
 * Call it once when the passenger/class form opens — gate `enabled` on the user
 * being logged in and the route being resolved (guests get a 401, so don't call
 * it for them). Treat the result as an enhancement: render the form regardless
 * and apply suggestions when they arrive.
 */
export function useSmartAutofill(
  params: SmartAutofillParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      "autofill",
      "smart",
      params.train_number,
      params.source_station_code,
      params.destination_station_code,
      params.journey_date ?? null,
    ],
    queryFn: () => autofillApi.suggest(params),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 min — suggestions for a route are stable per session
    retry: false, // a miss (401 / no signal) just means "skip autofill" — don't hammer
  });
}
