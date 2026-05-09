import axios, { AxiosError } from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

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
