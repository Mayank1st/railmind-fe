import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, type UpdateProfilePayload } from "@/lib/profile";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.update(payload),
    onSuccess: (updated) => {
      // The PATCH returns the full fresh profile, so write it straight into the
      // cache (instant UI update) and mark it for a background refetch.
      queryClient.setQueryData(["profile", "me"], updated);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}
