import axios, { AxiosError } from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Global session guard: if a request comes back 401 (token expired / session
// revoked while the user is active), bounce to /login with a `next` so they
// return where they were. Skips /auth/* calls (e.g. the /auth/me guest-check
// and login failures handle their own 401s) and avoids redirect loops.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthCall = url.includes("/auth/");
      const onLoginPage = window.location.pathname.startsWith("/login");
      if (!isAuthCall && !onLoginPage) {
        const next = window.location.pathname + window.location.search;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      }
    }
    return Promise.reject(error);
  }
);

export type ApiError = {
  status: number;
  message: string;
};

export function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const data = err.response?.data as
      | { message?: string; detail?: string }
      | undefined;
    return {
      status,
      message: data?.message ?? data?.detail ?? err.message ?? "Request failed",
    };
  }
  return { status: 0, message: "Network error" };
}
