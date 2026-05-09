import { api } from "./api";

export type User = {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  gender?: "female" | "male" | "other";
};

export type LoginPasswordPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export type LoginOtpRequestPayload = { email: string };

export type OtpVerifyPayload = { email: string; code: string };

export type RegisterPayload = {
  full_name: string;
  date_of_birth: string;
  email: string;
  country_code: string;
  mobile: string;
  password: string;
  gender: "female" | "male" | "other";
};

export const authApi = {
  me: () => api.get<User>("/auth/me").then((r) => r.data),

  loginPassword: (payload: LoginPasswordPayload) =>
    api.post<User>("/auth/login", payload).then((r) => r.data),

  requestOtp: (payload: LoginOtpRequestPayload) =>
    api.post<{ ok: true }>("/auth/otp/send", payload).then((r) => r.data),

  verifyOtp: (payload: OtpVerifyPayload) =>
    api.post<User>("/auth/otp/verify", payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<{ ok: true }>("/auth/register", payload).then((r) => r.data),

  logout: () => api.post<{ ok: true }>("/auth/logout").then((r) => r.data),
};
