import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { bookingsApi, type BookingFilter } from "@/lib/bookings";

// One page of the server-filtered bookings list. keepPreviousData keeps the
// current page on screen while the next one loads, so paging doesn't flicker.
// `search` runs server-side over the whole list (PNR / train number / name).
export function useBookingsList(
  filter: BookingFilter,
  page: number,
  size: number,
  search = ""
) {
  return useQuery({
    queryKey: ["bookings", "list", filter, page, size, search],
    queryFn: () => bookingsApi.listPaged({ filter, page, size, search }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
