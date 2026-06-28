import { api } from "./api";

export type WaitlistStatus = "WAITLISTED" | "NOT_WAITLISTED";
export type WaitlistBucket = "HIGH" | "MEDIUM" | "LOW";
export type WaitlistType = "GNWL" | "RLWL" | "PQWL" | "TQWL" | "RQWL";
export type WaitlistSource = "MODEL" | "RULES";
export type WaitlistAvailability = "AVAILABLE" | "RAC" | "WL";

export type WaitlistSignals = {
  wl_type: WaitlistType | null; // null on NOT_WAITLISTED
  current_position: number | null; // live WL position — the most relevant number
  booking_position: number | null; // position at booking (always >= current)
  days_to_journey: number | null;
  route_cancel_rate: number | null; // 0.0–1.0 (0.25 = history-thin fallback)
};

export type WaitlistAlternative = {
  train_number: string;
  train_name: string;
  train_type: string;
  journey_date: string; // ISO date — may be ±1 day from the booking
  date_offset_days: number; // 0 = same date, -1 / +1 = flexible date
  departs: string; // "HH:mm:ss"
  arrives: string; // "HH:mm:ss"
  duration_minutes: number;
  availability: WaitlistAvailability | null;
  available_seats: number | null; // confirmed seats left; null = unknown
};

export type WaitlistPrediction = {
  status: WaitlistStatus;
  booking_status: string | null; // set only when NOT_WAITLISTED (e.g. "CONFIRMED")
  confirmation_probability: number | null; // 0.0–1.0, null = degraded (don't show %)
  bucket: WaitlistBucket | null; // main render driver
  action: string | null; // one-line "what to do" — show as-is
  reason: string; // one-line human reason — show as-is
  signals: WaitlistSignals;
  suggest_alternatives: boolean; // true on LOW
  alternatives: WaitlistAlternative[]; // populated only when suggest_alternatives
  source: WaitlistSource; // MODEL = ML; RULES = heuristic/fallback (informational)
  model_version: string | null; // null when a rule decided (informational)
};

export type WaitlistPredictionResult = {
  prediction: WaitlistPrediction | null;
  threshold: number; // meta.confidence_threshold — firm-vs-soft wording reference
};

const DEFAULT_CONFIDENCE_THRESHOLD = 0.75;

type WaitlistPredictionEnvelope = {
  success?: boolean;
  data: WaitlistPrediction | null;
  meta: { confidence_threshold: number } | null;
};

export const waitlistPredictorApi = {
  predict: (pnr: string, explain = true) =>
    api
      .get<WaitlistPredictionEnvelope>(`/ai/waitlist/prediction/${pnr}`, {
        params: { explain },
      })
      .then<WaitlistPredictionResult>((r) => ({
        prediction: r.data?.success !== false ? (r.data?.data ?? null) : null,
        threshold:
          r.data?.meta?.confidence_threshold ?? DEFAULT_CONFIDENCE_THRESHOLD,
      })),
};
