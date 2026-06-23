import { api } from "./api";

/* ── Smart Form Autofill — GET /ai/form/smart-autofill ──
 * Pre-fills the booking form (class / quota / passengers / berth) from the
 * user's own booking history. The backend picks the engine (defaults → rules →
 * ML) and the response shape is always the same; `source` is info-only.
 *
 * Auth-only: it uses the cookie session (sent via `withCredentials` on the
 * shared client). Guests get a 401 — only call it for logged-in users.
 */

export type FieldSuggestion = {
  value: string | null;
  confidence: number; // 0.0 – 1.0
};

export type AutofillGender = "MALE" | "FEMALE" | "TRANSGENDER";

export type PassengerSuggestion = {
  passenger_id: string;
  full_name: string;
  age: number;
  gender: AutofillGender;
  berth: FieldSuggestion; // suggested berth for THIS passenger
  confidence: number; // how often this passenger is booked
};

export type AutofillSource = "MODEL" | "HISTORY" | "DEFAULTS";

// Most-booked train on THIS route for the user — a plain history count, not ML.
// Depends only on user + route, so it's returned even when train_number is omitted.
export type FavouriteTrain = {
  train_number: string;
  train_name: string;
  previous_booking_count: number;
};

export type SmartAutofill = {
  train_class: FieldSuggestion;
  quota: FieldSuggestion;
  passengers: PassengerSuggestion[];
  favourite_train: FavouriteTrain | null;
  source: AutofillSource;
  model_version: string | null; // present only when source = MODEL
  distance_bucket: "SHORT" | "MEDIUM" | "LONG" | "XLONG" | null;
  journey_distance_km: number | null;
  booking_count: number;
  based_on_bookings: number;
  auto_fill: boolean; // shortcut for train_class.confidence >= threshold
};

export type SmartAutofillParams = {
  // Omit train_number to get only the route-level `favourite_train` (no class/
  // berth prediction). Include it for full autofill on the chosen train.
  train_number?: string;
  source_station_code: string;
  destination_station_code: string;
  journey_date?: string; // yyyy-MM-dd — optional, sharpens the ML prediction
};

export type SmartAutofillResult = {
  // null when the backend returns success:false or a null body — callers should
  // skip autofill silently in that case.
  suggestion: SmartAutofill | null;
  // The confidence cut-off from the envelope `meta`. Compare each field's
  // confidence against this — don't hardcode 0.75.
  threshold: number;
};

const DEFAULT_CONFIDENCE_THRESHOLD = 0.75;

type AutofillEnvelope = {
  success?: boolean;
  data: SmartAutofill | null;
  meta: { confidence_threshold: number } | null;
};

export const autofillApi = {
  suggest: (params: SmartAutofillParams) =>
    api
      .get<AutofillEnvelope>("/ai/form/smart-autofill", { params })
      .then<SmartAutofillResult>((r) => ({
        suggestion: r.data?.success !== false ? (r.data?.data ?? null) : null,
        threshold:
          r.data?.meta?.confidence_threshold ?? DEFAULT_CONFIDENCE_THRESHOLD,
      })),
};
