import { useQueries } from "@tanstack/react-query";
import { bookingsApi, type BookingFilter } from "@/lib/bookings";

const FILTERS: BookingFilter[] = ["ALL", "UPCOMING", "COMPLETED", "CANCELLED"];

// Per-tab totals for the list page. Each filter's count comes from meta.total
// of a cheap size=1 query, so the four tab badges stay accurate without
// pulling every row. Returns null per tab until that count resolves.
export function useBookingCounts(): Record<BookingFilter, number | null> {
  const results = useQueries({
    queries: FILTERS.map((filter) => ({
      queryKey: ["bookings", "count", filter],
      queryFn: () => bookingsApi.listPaged({ filter, page: 1, size: 1 }),
      staleTime: 60_000,
    })),
  });

  return FILTERS.reduce(
    (acc, filter, i) => {
      acc[filter] = results[i]?.data?.meta?.total ?? null;
      return acc;
    },
    {} as Record<BookingFilter, number | null>
  );
}
