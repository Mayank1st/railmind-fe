import { useQuery } from "@tanstack/react-query";
import { receiptsApi } from "@/lib/receipt";

// Fetches the tax-invoice receipt for a booking. Pass `enabled: false` to defer
// the request until the receipt modal actually opens.
export function useReceipt(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: ["bookings", "receipt", bookingId],
    queryFn: () => receiptsApi.view(bookingId),
    enabled: enabled && Boolean(bookingId),
    staleTime: 5 * 60_000,
  });
}
