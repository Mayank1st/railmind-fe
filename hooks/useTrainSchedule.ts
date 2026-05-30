import { useQuery } from "@tanstack/react-query";
import { trainSearchApi } from "@/lib/train";

export function useTrainSchedule(trainNumber: string | null) {
  return useQuery({
    queryKey: ["train", "schedule", trainNumber],
    queryFn: () => trainSearchApi.getTrainSchedule(trainNumber!),
    enabled: !!trainNumber,
    staleTime: 30 * 60 * 1000,
  });
}
