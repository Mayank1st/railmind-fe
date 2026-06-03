import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, type ProfileDetails } from "@/lib/profile";
import { useAuthStore } from "@/store/auth";

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadPhoto(file),
    onSuccess: ({ profile_photo }) => {
      // Cache-bust: the backend may return the same URL on re-upload, so the
      // browser would keep serving the cached old image. A unique `?v=` token
      // forces a fresh fetch and a new `src` string every time.
      const url = `${profile_photo}${profile_photo.includes("?") ? "&" : "?"}v=${Date.now()}`;

      // PROD way — no polling: the upload returns the new URL, so we patch it
      // straight into the cached profile. Every `useProfile()` consumer updates
      // instantly, with zero extra network calls.
      queryClient.setQueryData<ProfileDetails>(["profile", "me"], (prev) =>
        prev ? { ...prev, profile_photo: url } : prev
      );

      // Keep the auth store (navbar avatar) in sync too. getState() avoids a
      // stale closure on the user object.
      const { user, setUser } = useAuthStore.getState();
      if (user) setUser({ ...user, profile_photo: url });
    },
  });
}
