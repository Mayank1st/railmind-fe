import { useQuery } from "@tanstack/react-query";
import { bookingsApi, type JourneyAction } from "@/lib/bookings";

export function useJourneys(action: JourneyAction) {
  return useQuery({
    queryKey: ["bookings", "journeys", action],
    queryFn: () => bookingsApi.list(action),
    staleTime: 60_000,
  });
}
