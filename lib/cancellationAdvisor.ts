import { api } from "./api";
import type { WaitlistAlternative, WaitlistBucket } from "./waitlistPredictor";

export type AdvisorStatus =
  | "ADVISED"
  | "ALREADY_CANCELLED"
  | "NOT_CANCELLABLE"
  | "NOT_APPLICABLE";

export type AdvisorRecommendation =
  | "HOLD"
  | "MONITOR"
  | "CANCEL_NOW"
  | "CANCEL_EARLY";

export type RefundRule =
  | "FLAT_CHARGE"
  | "PERCENT_25"
  | "PERCENT_50"
  | "NO_REFUND"
  | "TATKAL_NO_REFUND"
  | "CLERKAGE"
  | "ZERO_FARE";

export type RefundWindow =
  | "BEFORE_48H"
  | "H48_TO_12H"
  | "H12_TO_4H"
  | "UNDER_4H";

export type PassengerRefund = {
  passenger_status: string; // CNF | RAC | WL
  fare: number;
  deduction_amount: number;
  refund_amount: number;
  rule: RefundRule;
};

export type RefundBreakdown = {
  total_paid: number;
  refund_amount: number; // if cancelled right now
  deduction_amount: number;
  per_passenger: PassengerRefund[];
};

export type RefundLadderStep = {
  window: RefundWindow;
  cancel_by: string | null; // ISO with IST offset; null on the last open window
  refund_amount: number;
  rule: RefundRule;
  is_current: boolean;
};

export type AdvisorWaitlist = {
  confirmation_probability: number | null; // null = degraded, don't show a real %
  bucket: WaitlistBucket | null;
  model_version: string | null; // non-null → show an "AI" badge
};

export type AdvisorSignals = {
  booking_status: string;
  train_class: string | null;
  quota: string | null;
  is_tatkal: boolean;
  hours_to_departure: number | null;
  is_chart_prepared: boolean;
  journey_date: string | null; // ISO date
};

export type CancellationAdvice = {
  status: AdvisorStatus;
  pnr_number: string;
  booking_status: string;
  recommendation: AdvisorRecommendation | null; // null → advisor OFF / terminal
  action: string | null; // ready-made verdict one-liner — show as-is
  reason: string; // sentence with the actual numbers — show verbatim
  refund: RefundBreakdown | null; // null on terminal states
  refund_ladder: RefundLadderStep[]; // CONFIRMED only, else []
  waitlist: AdvisorWaitlist | null; // WAITLISTED only, else null
  suggest_alternatives: boolean; // true when the WL bucket is LOW
  alternatives: WaitlistAlternative[];
  signals: AdvisorSignals;
  source: "MODEL" | "RULES";
};

export type CancellationAdviceResult = {
  advice: CancellationAdvice | null;
  // meta.advisor_enabled=false → recommendation is null but refund figures are
  // still present and exact; render the refund cards without the verdict hero.
  advisorEnabled: boolean;
};

type CancellationAdviceEnvelope = {
  success?: boolean;
  data: CancellationAdvice | null;
  meta: { advisor_enabled?: boolean } | null;
};

export const cancellationAdvisorApi = {
  // explain=false → cheap templated reason (prefetch); explain=true → LLM-written
  // friendly reason (~1–2 s slower) for when the advice is actually shown.
  getAdvice: (pnr: string, explain = true) =>
    api
      .get<CancellationAdviceEnvelope>(`/ai/cancellation/advisor/${pnr}`, {
        params: { explain },
      })
      .then<CancellationAdviceResult>((r) => ({
        advice: r.data?.success !== false ? (r.data?.data ?? null) : null,
        advisorEnabled: r.data?.meta?.advisor_enabled ?? true,
      })),
};
