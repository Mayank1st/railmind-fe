import { api } from "./api";

export type FareDecision = "URGENT" | "BOOK_NOW" | "CAN_WAIT";
export type BookingVelocity = "HIGH" | "MODERATE" | "LOW";
export type FareAdvisorSource = "MODEL" | "RULES";

export type FareAdvisorSignals = {
  fill_rate: number | null; // seats taken / total (0.0–1.0). null = no live inventory
  days_to_journey: number; // can be negative for past dates
  booking_velocity: BookingVelocity; // recent demand
  waitlist_pressure: number | null; // WL load (0.0–1.0). null = no live inventory
};

export type FareAdvice = {
  decision: FareDecision;
  confidence: number; // 0.0–1.0 — compare against `threshold`, don't hardcode 0.75
  reason: string; // one-line nudge (Gemini when explain=true, else templated) — show as-is
  signals: FareAdvisorSignals;
  source: FareAdvisorSource; // MODEL = ML decided; RULES = heuristic/cold-start/fallback
  model_version: string | null; // set only when the ML model produced the decision
};

export type FareAdvisorParams = {
  train_number: string;
  source_station_code: string;
  destination_station_code: string;
  train_class: string; // SL | 3A | 2A | 1A | CC | 2S | FC | 3E
  journey_date: string; // yyyy-MM-dd
  quota?: string; // GN | TQ | PT | LD | SS | HP | DF | FT — default GN
  explain?: boolean; // false skips the Gemini reason (faster) — default true
};

export type FareAdvisorResult = {
  advice: FareAdvice | null;
  threshold: number;
};

const DEFAULT_CONFIDENCE_THRESHOLD = 0.75;

type FareAdvisorEnvelope = {
  success?: boolean;
  data: FareAdvice | null;
  meta: { confidence_threshold: number } | null;
};

export type FareAdvisorBatchItem = {
  train_number: string;
  train_class: string;
  journey_date: string; // yyyy-MM-dd
  quota?: string; // default GN
};

export type FareAdvisorBatchResult = {
  advices: (FareAdvice | null)[];
  threshold: number;
};

type FareAdvisorBatchEnvelope = {
  success?: boolean;
  data: (FareAdvice | null)[] | null;
  meta: { confidence_threshold: number; count?: number } | null;
};

export const fareAdvisorApi = {
  advise: (params: FareAdvisorParams) =>
    api
      .get<FareAdvisorEnvelope>("/ai/fare/advisor", { params })
      .then<FareAdvisorResult>((r) => ({
        advice: r.data?.success !== false ? (r.data?.data ?? null) : null,
        threshold:
          r.data?.meta?.confidence_threshold ?? DEFAULT_CONFIDENCE_THRESHOLD,
      })),

  adviseBatch: (items: FareAdvisorBatchItem[]) =>
    api
      .post<FareAdvisorBatchEnvelope>("/ai/fare/advisor/batch", items)
      .then<FareAdvisorBatchResult>((r) => ({
        advices: r.data?.success !== false ? (r.data?.data ?? []) : [],
        threshold:
          r.data?.meta?.confidence_threshold ?? DEFAULT_CONFIDENCE_THRESHOLD,
      })),
};
