import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, type ProcessPaymentPayload } from "@/lib/payments";

export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessPaymentPayload) =>
      paymentsApi.process(payload),
    // A processed payment confirms the booking — refresh the journeys lists.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
