import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/bookings";

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
