import { useQuery } from "@tanstack/react-query";
import { trainSearchApi } from "@/lib/train";

export function useTrainDetails(trainNumber: string | null) {
  return useQuery({
    queryKey: ["train", "details", trainNumber],
    queryFn: () => trainSearchApi.getTrainDetails(trainNumber!),
    enabled: !!trainNumber,
    staleTime: 30 * 60 * 1000,
  });
}
