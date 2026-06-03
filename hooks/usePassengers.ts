import { useQuery } from "@tanstack/react-query";
import { passengersApi } from "@/lib/passengers";

export function usePassengers() {
  return useQuery({
    queryKey: ["passengers"],
    queryFn: () => passengersApi.list(),
    staleTime: 60_000,
  });
}
