import { api } from "./api";

export const BASE_FARE: Record<string, number> = {
  SL: 655,
  "3A": 1745,
  "2A": 2515,
  "1A": 4250,
  CC: 905,
  "2S": 355,
  FC: 2100,
  "3E": 1490,
};

const AC_CLASSES = ["1A", "2A", "3A", "CC", "3E", "FC"];
const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeFare(cls: string, count: number) {
  const perPax = BASE_FARE[cls] ?? 655;
  const base = count * perPax;
  const reservation = 40;
  const superfast = 45;
  const gst = AC_CLASSES.includes(cls) ? round2(base * 0.05) : 0;
  const irctc = round2(count * 7.875);
  const charges = reservation + superfast + gst + irctc;
  return {
    perPax,
    base,
    reservation,
    superfast,
    gst,
    irctc,
    subtotal: base,
    charges,
    total: base + charges,
  };
}

export const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Real fare from the backend ───────────────────────────────────────────────
export type FarePreviewParams = {
  train_number: string;
  from_station: string;
  to_station: string;
  train_class: string;
  quota: string;
  journey_date: string; // yyyy-MM-dd
  passenger_count: number;
  train_type: string;
};

export type FarePreview = {
  base_fare: number;
  passenger_count: number;
  reservation_charge: number;
  superfast_charge: number;
  tatkal_charge: number;
  gst: number;
  irctc_charge: number;
  total_fare: number;
};

export const fareApi = {
  preview: (params: FarePreviewParams) =>
    api
      .post<{ data: FarePreview }>("/bookings/fare-preview", params)
      .then((r) => r.data.data),
};
