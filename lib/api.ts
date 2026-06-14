import axios, { AxiosError } from "axios";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// opens a new socket and succeeds.
const RETRYABLE_STATUS = new Set([500, 502, 504]);
const MAX_RETRIES = 2;

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as
    | (typeof error.config & { __retryCount?: number })
    | undefined;
  const status = error.response?.status;
  const transient = status === undefined || RETRYABLE_STATUS.has(status);
  if (
    config &&
    config.method?.toLowerCase() === "get" &&
    transient &&
    (config.__retryCount ?? 0) < MAX_RETRIES
  ) {
    const attempt = (config.__retryCount ?? 0) + 1;
    config.__retryCount = attempt;
    await new Promise((r) => setTimeout(r, 300 * attempt));
    return api.request(config);
  }
  return Promise.reject(error);
});

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
  code?: string;
};

export function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 0;
    const data = err.response?.data as
      | {
          message?: string;
          detail?: string;
          code?: string;
          errors?: Array<{ code?: string; message?: string }>;
        }
      | undefined;
    return {
      status,
      message: data?.message ?? data?.detail ?? err.message ?? "Request failed",
      code: data?.code ?? data?.errors?.[0]?.code,
    };
  }
  return { status: 0, message: "Network error" };
}
