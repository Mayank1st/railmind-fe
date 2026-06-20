import { api } from "./api";

export type User = {
  id: string;
  // Nullable: Google sign-up users have no name/gender until they complete
  // their profile (`/auth/me` returns null for these fields meanwhile).
  first_name: string | null;
  last_name: string | null;
  email: string;
  mobile?: string;
  gender?: string | null;
  marital_status?: string | null;
  profile_photo?: string | null;
};

export type LoginPasswordPayload = {
  email: string;
  password: string;
  // Backend field (snake_case): extends the session lifetime when the user
  // ticks "Remember me". Defaults to false server-side.
  remember_me?: boolean;
};

export type LoginOtpRequestPayload = { email: string };

export type OtpVerifyPayload = { email: string; code: string };

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  country_code: string;
  mobile: string;
  password: string;
  gender: "female" | "male" | "other";
};

/**
 * Shape of `data` returned by POST /auth/google on success. The session itself
 * lives in httpOnly cookies (set by the backend); this payload only tells us
 * whether to onboard the user and how to prefill their profile.
 */
export type GoogleAuthResult = {
  is_new_user: boolean;
  username?: string;
  email?: string;
  suggested_first_name?: string | null;
  suggested_last_name?: string | null;
};

export const authApi = {
  me: () => api.get("/auth/me").then((r) => r.data.data),

  loginPassword: (payload: LoginPasswordPayload) =>
    api.post("/auth/login", payload).then((r) => r.data.data),

  requestOtp: (payload: LoginOtpRequestPayload) =>
    api.post("/auth/otp/send", payload).then((r) => r.data),

  verifyOtp: (payload: OtpVerifyPayload) =>
    api.post("/auth/otp/verify", payload).then((r) => r.data.data),

  register: (payload: RegisterPayload) =>
    api.post("/auth/register", payload).then((r) => r.data),

  // Exchange a Google ID token (the GIS `credential`) for a backend session.
  // The cookies are set by the backend on this response (withCredentials is on
  // the axios instance); we only read `data` to decide where to route next.
  // `rememberMe` mirrors the "Remember me" tick — sent as snake_case to the BE.
  google: (idToken: string, rememberMe = false): Promise<GoogleAuthResult> =>
    api
      .post("/auth/google", { id_token: idToken, remember_me: rememberMe })
      .then((r) => r.data.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),
};
