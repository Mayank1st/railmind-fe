import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, type CreateBookingPayload } from "@/lib/bookings";

// Persists a booking (status "pending") and returns its booking_id, which the
// payment flow then initiates against.
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
