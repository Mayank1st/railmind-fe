import { useQuery } from "@tanstack/react-query";
import { fareEnquiryApi, type FareEnquiryParams } from "@/lib/fare";

export function useFareEnquiry(
  params: FareEnquiryParams | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["fare-enquiry", params],
    queryFn: () => fareEnquiryApi.enquiry(params!),
    enabled: enabled && !!params,
    staleTime: 5 * 60 * 1000,
  });
}
