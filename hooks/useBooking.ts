import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/bookings";

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["bookings", "detail", id],
    queryFn: () => bookingsApi.get(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
