"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { berthLabel, genderShort, passengerDoc } from "@/lib/passengers";
import { toApiError } from "@/lib/api";
import { useBookingStore, type BookingPassenger } from "@/store/booking";
import { usePassengers } from "@/hooks/usePassengers";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const QUOTA_LABEL: Record<string, string> = {
  GN: "General",
  TQ: "Tatkal",
  PT: "Premium Tatkal",
  LD: "Ladies",
  LB: "Lower Berth",
  HP: "Handicapped",
  DF: "Defence",
  SS: "Senior Citizen",
  FT: "Foreign Tourist",
};

const BASE_FARE: Record<string, number> = {
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
const TYPE_WORDS = [
  "Rajdhani",
  "Shatabdi",
  "Duronto",
  "Superfast",
  "Express",
  "Special",
];

const CANCELLATION = [
  { window: "48h+ before", refund: "Free", note: "₹240 fee" },
  { window: "12–48h before", refund: "50% refund", note: "₹655 deduction" },
  { window: "Within 12h", refund: "No refund", note: "—" },
];

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function durationLabel(dep: string, arr: string) {
  const [dh, dm] = dep.split(":").map(Number);
  const [ah, am] = arr.split(":").map(Number);
  if ([dh, dm, ah, am].some(Number.isNaN)) return "";
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins <= 0) mins += 24 * 60;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function BookingReviewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const store = useBookingStore();
  const { data: saved = [] } = usePassengers();
  const createBooking = useCreateBooking();

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Journey: prefer the store, fall back to URL params (refresh / direct nav).
  const journey = store.journey ?? {
    train: sp.get("train") ?? "—",
    name: sp.get("name") ?? "Train",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    dep: sp.get("dep")?.slice(0, 5) ?? "",
    arr: sp.get("arr")?.slice(0, 5) ?? "",
    date: sp.get("date"),
    cls: sp.get("class") ?? "SL",
    quota: sp.get("quota") ?? "GN",
  };

  // Passengers: store-first; on refresh resolve the URL `pax` ids from the API.
  const passengers: BookingPassenger[] = useMemo(() => {
    if (store.passengers.length) return store.passengers;
    const ids = (sp.get("pax") ?? "").split(",").filter(Boolean);
    return saved
      .filter((p) => ids.includes(p.id))
      .map((p) => ({ ...p, berth: p.berth_preference ?? "NP" }));
  }, [store.passengers, saved, sp]);

  const count = passengers.length;
  const fare = BASE_FARE[journey.cls] ?? 655;
  const quotaLabel = QUOTA_LABEL[journey.quota] ?? journey.quota;
  const trainType = TYPE_WORDS.find((t) =>
    journey.name.toLowerCase().includes(t.toLowerCase())
  );

  const dateShort = useMemo(
    () => fmt(journey.date, "EEE, dd MMM"),
    [journey.date]
  );
  const dateLong = useMemo(
    () => fmt(journey.date, "EEE, dd MMM yyyy"),
    [journey.date]
  );
  const duration = durationLabel(journey.dep, journey.arr);

  // Fare breakdown (display-only — no fare API yet).
  const base = count * fare;
  const reservation = 40;
  const superfast = 45;
  const gst = AC_CLASSES.includes(journey.cls)
    ? Math.round(base * 0.05 * 100) / 100
    : 0;
  const irctc = Math.round(count * 7.875 * 100) / 100;
  const total = base + reservation + superfast + gst + irctc;

  function editPassengers() {
    const qs = new URLSearchParams({
      train: journey.train,
      name: journey.name,
      from: journey.from,
      to: journey.to,
      dep: journey.dep,
      arr: journey.arr,
      class: journey.cls,
      quota: journey.quota,
      ...(journey.date ? { date: journey.date } : {}),
    });
    router.push(`/book/passengers?${qs.toString()}`);
  }

  async function proceedToPay() {
    if (!agreed || count === 0 || createBooking.isPending) return;
    setError(null);
    try {
      const booking = await createBooking.mutateAsync({
        train_number: journey.train,
        journey_date: toApiDate(journey.date),
        from_station: journey.from,
        to_station: journey.to,
        train_class: journey.cls,
        quota: journey.quota,
        passengers: passengers.map((p) => ({
          passenger_id: p.id,
          berth_preference: p.berth,
        })),
      });

      store.setBookingId(booking.booking_id);
      store.markStepComplete(2); // step 2 done → Payment becomes reachable

      // Carry booking_id (and pnr) in the URL too, so a refresh on the payment
      // page still resolves the booking via the store/URL fallback.
      const qs = new URLSearchParams(sp.toString());
      qs.set("booking_id", booking.booking_id);
      if (booking.pnr_number) qs.set("pnr", booking.pnr_number);
      router.push(`/book/payment?${qs.toString()}`);
    } catch (e) {
      setError(toApiError(e).message);
    }
  }

  return (
    <div className="app-container-narrow py-8">
      {/* Journey summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6a572]/20 bg-[#1f1810] px-5 py-3.5 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-[#d6a572]">{journey.train}</span>
          <span className="text-foreground font-medium">{journey.name}</span>
          <span className="text-muted-foreground">
            {journey.from} {journey.dep}{" "}
            <ArrowRight className="inline h-3.5 w-3.5" /> {journey.to}{" "}
            {journey.arr}
          </span>
        </div>
        <span className="text-muted-foreground">
          {dateShort} · {journey.cls} · {quotaLabel} · {count} pax
        </span>
      </div>

      {/* Stepper */}
      <div className="mt-8">
        <BookingStepper current={2} />
      </div>

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          <h1 className="font-heading text-foreground text-4xl font-normal tracking-[-0.5px]">
            Review your booking
          </h1>

          {/* Train card */}
          <Card className="bg-card/40 overflow-hidden border-white/8 py-0 shadow-none">
            <div className="h-1 bg-[#d6a572]" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">
                    {journey.train}
                    {trainType ? ` · ${trainType}` : ""}
                  </p>
                  <h2 className="font-heading text-foreground mt-1 text-2xl">
                    {journey.name}
                  </h2>
                </div>
                <div className="text-right text-sm">
                  <p className="text-foreground">{dateLong}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {journey.cls} · {quotaLabel} quota
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-foreground text-3xl font-medium">
                    {journey.dep}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {journey.from}
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-center px-6">
                  <p className="text-muted-foreground text-xs">{duration}</p>
                  <div className="my-1.5 h-px w-full bg-white/12" />
                </div>
                <div className="text-right">
                  <p className="text-foreground text-3xl font-medium">
                    {journey.arr}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {journey.to}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passengers */}
          <Card className="bg-card/40 border-white/8 py-0 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-foreground text-lg font-medium">
                  Passengers
                </h2>
                <Button
                  variant="link"
                  onClick={editPassengers}
                  className="h-auto p-0 text-sm font-medium text-[#d6a572] hover:text-[#e6bd8a]"
                >
                  Edit
                </Button>
              </div>

              <Table className="mt-4">
                <TableHeader>
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-muted-foreground w-8 text-xs tracking-wider uppercase">
                      #
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">
                      Age / Gender
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">
                      ID
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">
                      Berth Pref
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passengers.map((p, i) => (
                    <TableRow
                      key={p.id}
                      className="border-white/8 hover:bg-transparent"
                    >
                      <TableCell className="text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {p.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.age} / {genderShort(p.gender)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {passengerDoc(p) || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {berthLabel(p.berth)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {passengers.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground py-6 text-center text-sm"
                      >
                        No passengers selected.{" "}
                        <button
                          onClick={editPassengers}
                          className="cursor-pointer text-[#d6a572] hover:underline"
                        >
                          Go back
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cancellation policy */}
          <Card className="bg-card/40 border-white/8 shadow-none">
            <CardContent className="p-6">
              <h2 className="font-heading text-foreground text-lg font-medium">
                Cancellation Policy
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {CANCELLATION.map((c) => (
                  <div
                    key={c.window}
                    className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
                  >
                    <p className="text-muted-foreground text-xs">{c.window}</p>
                    <p className="text-foreground mt-1.5 text-[15px] font-medium">
                      {c.refund}
                    </p>
                    <p className="text-muted-foreground/70 mt-1 text-xs">
                      {c.note}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column — Fare breakdown ── */}
        <div>
          <Card className="bg-card/40 sticky top-6 border-white/8 shadow-none">
            <CardContent className="p-6">
              <h2 className="font-heading text-foreground text-lg font-medium">
                Fare breakdown
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <FareRow
                  label={`Base fare (${count} × ₹${fare})`}
                  value={inr(base)}
                />
                <FareRow label="Reservation charge" value={inr(reservation)} />
                <FareRow label="Superfast charge" value={inr(superfast)} />
                <FareRow label="GST (5%)" value={inr(gst)} />
                <FareRow label="IRCTC service charge" value={inr(irctc)} />
              </dl>

              <div className="my-5 h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">Total</span>
                <span className="font-heading text-foreground text-2xl">
                  {inr(total)}
                </span>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(Boolean(v))}
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  I agree to RailMind&apos;s Terms and the cancellation policy
                  above.
                </span>
              </label>

              {error && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={proceedToPay}
                disabled={!agreed || count === 0 || createBooking.isPending}
                className="mt-5 w-full rounded-xl bg-[#d6a572] py-5 font-medium text-[#3d2817] hover:bg-[#c89a64]"
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating booking…
                  </>
                ) : (
                  <>
                    Proceed to Pay
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function fmt(date: string | null, pattern: string) {
  if (!date) return "—";
  const d = parseISO(date);
  return isValid(d) ? format(d, pattern) : date;
}

// Create-booking expects a plain yyyy-MM-dd date.
function toApiDate(date: string | null): string {
  if (!date) return "";
  const d = parseISO(date);
  return isValid(d) ? format(d, "yyyy-MM-dd") : date;
}
