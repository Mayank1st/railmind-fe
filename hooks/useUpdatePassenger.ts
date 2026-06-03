import { useMutation, useQueryClient } from "@tanstack/react-query";
import { passengersApi, type UpdatePassengerPayload } from "@/lib/passengers";

export function useUpdatePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePassengerPayload;
    }) => passengersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
    },
  });
}
