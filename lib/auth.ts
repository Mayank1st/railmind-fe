import { api } from "./api";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
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
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  country_code: string;
  mobile: string;
  password: string;
  gender: "female" | "male" | "other";
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

  logout: () => api.post("/auth/logout").then((r) => r.data),
};
