import { useMutation, useQueryClient } from "@tanstack/react-query";
import { passengersApi } from "@/lib/passengers";

export function useDeletePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => passengersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
    },
  });
}
