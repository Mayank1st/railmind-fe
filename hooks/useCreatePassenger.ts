import { useMutation, useQueryClient } from "@tanstack/react-query";
import { passengersApi, type CreatePassengerPayload } from "@/lib/passengers";

export function useCreatePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePassengerPayload) =>
      passengersApi.create(payload),
    // Refresh the shared list so both the /passengers page and the booking
    // flow see the new passenger.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
    },
  });
}
