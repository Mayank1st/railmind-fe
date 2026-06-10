import { useQuery } from "@tanstack/react-query";
import { pnrApi } from "@/lib/pnr";

export function usePnrStatus(pnr: string | null) {
  return useQuery({
    queryKey: ["pnr", pnr],
    queryFn: () => pnrApi.checkStatus(pnr!),
    enabled: !!pnr && pnr.length === 10,
    staleTime: 15 * 60 * 1000, // 15 min — PNR status frequently change nahi hota
  });
}
