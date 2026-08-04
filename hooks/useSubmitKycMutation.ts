import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileApi, type UpdateProfilePayload } from "@/lib/profile";

/**
 * Saves the confirmed KYC details through the existing profile endpoint — there
 * is no KYC-specific write API. The ID number is encrypted server-side and
 * `kyc_status` stays PENDING until an admin approves it; nothing here can move
 * that status.
 *
 * Unlike `useUpdateProfile` this only invalidates the cached profile rather than
 * writing the response into it: this PATCH's job is the ID number, and the
 * masked echo is a narrower object than a full profile. Refetching /auth/me is
 * the reliable way to get the post-submit state.
 */
export function useSubmitKycMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}
