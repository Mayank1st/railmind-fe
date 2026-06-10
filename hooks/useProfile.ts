import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/profile";

export function useProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.get(),
    staleTime: 60_000,
  });
}
