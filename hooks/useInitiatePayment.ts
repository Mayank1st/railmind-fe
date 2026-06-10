import { useMutation } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/payments";

// Creates the payment record for a booking and returns the payment_id used by
// the subsequent /payments/process call.
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (bookingId: string) => paymentsApi.initiate(bookingId),
  });
}
