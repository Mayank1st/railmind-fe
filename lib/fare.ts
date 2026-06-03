// Display-only fare model (the API has no fare field yet). Shared by the
// Review and Payment steps so their numbers always agree.

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
