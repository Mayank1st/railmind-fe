import { useQuery } from "@tanstack/react-query";
import { trainSearchApi } from "@/lib/train";

export function useSeatAvailability(
  trainNumber: string,
  date: string | null,
  fromStation: string,
  toStation: string,
  trainClass: string,
  quota: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["seat-availability", trainNumber, date, trainClass, quota],
    queryFn: () =>
      trainSearchApi.getSeatAvailability(
        trainNumber,
        date,
        fromStation,
        toStation,
        trainClass,
        quota
      ),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
