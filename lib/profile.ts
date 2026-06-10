import { api } from "./api";

/**
 * Exact shape returned by GET /auth/me (snake_case, same as the backend).
 * Keep this in sync with the API — if the backend adds a field, add it here
 * and it becomes available everywhere `useProfile()` is used.
 */
export type ProfileDetails = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_email_verified: boolean;
  is_mobile_verified: boolean;
  preferred_language: string;
  profile_photo: string | null;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string; // ISO date, e.g. "1998-09-24"
  marital_status: string;
  nationality: string;
  occupation: string;
  mobile_number: string;
  address_line1: string;
  street: string;
  state: string;
  pin_code: string;
  country: string;
  pan_number: string | null; // already masked by backend, e.g. "XXXXXX236G"
  adhaar_number: string | null; // already masked, e.g. "XXXXXXXX1236" (backend spelling)
  kyc_status: string;
};

/**
 * Editable personal fields. Partial — send only what changed (PATCH).
 * Mirrors the backend UpdateUserProfileDTO.
 *
 * NOTE on mobile_number: accepted by update-profile (Phase A), but the backend
 * treats it as a verifiable credential — changing it resets is_mobile_verified
 * to false and a duplicate number is rejected with RM-AUTH-010 (409). OTP
 * re-verification lands in Phase B (SMS infra), so a saved number is "unverified"
 * until then.
 */
export type UpdateProfilePayload = Partial<
  Pick<
    ProfileDetails,
    | "first_name"
    | "last_name"
    | "date_of_birth"
    | "gender"
    | "marital_status"
    | "nationality"
    | "occupation"
    | "mobile_number"
  >
>;

export const profileApi = {
  // Backend wraps payloads as { data: ... }, so we unwrap r.data.data —
  // same as bookingsApi.list / authApi.me.
  get: () =>
    api.get<{ data: ProfileDetails }>("/auth/me").then((r) => r.data.data),

  // PATCH = partial update: only the keys in `payload` are sent/changed.
  update: (payload: UpdateProfilePayload) =>
    api
      .patch<{ data: ProfileDetails }>("/auth/update-profile", payload)
      .then((r) => r.data.data),

  // multipart/form-data upload. We pass a FormData body and let axios set the
  // Content-Type (with the boundary) — overriding the client's JSON default.
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append("profile_photo", file);
    return api
      .post<{
        data: { profile_photo: string };
      }>("/auth/upload-profile-photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },
};
