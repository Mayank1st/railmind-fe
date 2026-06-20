import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/bookings";

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["bookings", "detail", id],
    queryFn: () => bookingsApi.get(id),
    enabled: Boolean(id),
    // Chart prep flips passenger status in the background — always pull fresh on
    // screen open / window focus so the latest chart_status + statuses show.
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
