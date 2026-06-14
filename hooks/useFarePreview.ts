import { useQuery } from "@tanstack/react-query";
import { fareApi, type FarePreviewParams } from "@/lib/fare";

export function useFarePreview(params: FarePreviewParams, enabled: boolean) {
  return useQuery({
    queryKey: [
      "fare-preview",
      params.train_number,
      params.from_station,
      params.to_station,
      params.train_class,
      params.quota,
      params.journey_date,
      params.passenger_count,
    ],
    queryFn: () => fareApi.preview(params),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
