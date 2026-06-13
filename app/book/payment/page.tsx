"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { computeFare, inr } from "@/lib/fare";
import { toApiError } from "@/lib/api";
import {
  isPaymentFailed,
  isPaymentSuccess,
  type ProcessPaymentPayload,
} from "@/lib/payments";
import { useBookingStore } from "@/store/booking";
import { usePassengers } from "@/hooks/usePassengers";
import { useBooking } from "@/hooks/useBooking";
import { useInitiatePayment } from "@/hooks/useInitiatePayment";
import { useProcessPayment } from "@/hooks/useProcessPayment";
import { useCancelBooking } from "@/hooks/useCancelBooking";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const QUOTA_LABEL: Record<string, string> = {
  GN: "General",
  TQ: "Tatkal",
  PT: "Premium Tatkal",
  LD: "Ladies",
  SS: "Senior Citizen",
};

// Only UPI and CARD are wired to the backend; the rest are shown as upcoming.
const METHODS = [
  {
    id: "upi",
    title: "UPI",
    sub: "Google Pay, PhonePe, Paytm, BHIM",
    badge: "Fastest",
  },
  {
    id: "card",
    title: "Credit / Debit Card",
    sub: "Visa, Mastercard, Rupay, Amex",
  },
  {
    id: "netbanking",
    title: "Net Banking",
    sub: "50+ banks supported",
    disabled: true,
  },
  {
    id: "wallet",
    title: "Wallets",
    sub: "Paytm, Mobikwik, Amazon Pay",
    disabled: true,
  },
];

const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM", "Other"];

const RESERVE_SECONDS = 600; // 10:00 hold

// name@bank — non-empty handle + alphabetic-led bank suffix.
const VPA_RE = /^[\w.\-]{2,}@[a-zA-Z][\w.\-]+$/;
// MM / YY or MM/YY, month 01–12.
const EXPIRY_RE = /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/;

export default function BookingPaymentPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const store = useBookingStore();
  const { data: saved = [] } = usePassengers();

  const initiate = useInitiatePayment();
  const processPayment = useProcessPayment();
  const cancelBooking = useCancelBooking();

  // Set when payment fails: the booking is cancelled server-side and the held
  // seat released, so this becomes a terminal "rebook" state (retrying the same
  // booking would 422). Holds the failure reason to show the user.
  const [cancelledReason, setCancelledReason] = useState<string | null>(null);

  const [method, setMethod] = useState("upi");
  const [upiApp, setUpiApp] = useState("Google Pay");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [seconds, setSeconds] = useState(RESERVE_SECONDS);
  const [error, setError] = useState<string | null>(null);

  // booking_id: store-first, URL fallback (refresh / direct nav).
  const urlBookingId = sp.get("booking_id") ?? "";
  const bookingId = store.bookingId ?? urlBookingId;

  // ── Re-payment guard ──────────────────────────────────────────────────────
  const paidInStore = Boolean(bookingId) && store.paidBookingId === bookingId;
  const coldStore = !store.bookingId && Boolean(urlBookingId);
  const verify = useBooking(coldStore && !paidInStore ? urlBookingId : "");
  const serverStatus = verify.data?.booking_status?.toLowerCase() ?? null;
  const serverPaid =
    serverStatus === "confirmed" ||
    serverStatus === "rac" ||
    serverStatus === "waitlisted";
  const serverCancelled = serverStatus === "cancelled";

  const verifying = coldStore && !paidInStore && verify.isLoading;
  const redirectToConfirmed = paidInStore || serverPaid;

  useEffect(() => {
    if (!redirectToConfirmed) return;
    const qs = new URLSearchParams(sp.toString());
    const pnr = store.pnr ?? verify.data?.pnr_number;
    const status = store.bookingStatus ?? serverStatus;
    if (pnr) qs.set("pnr", pnr);
    if (status) qs.set("status", status);
    router.replace(`/book/confirmed?${qs.toString()}`);
  }, [
    redirectToConfirmed,
    sp,
    store.pnr,
    store.bookingStatus,
    verify.data,
    serverStatus,
    router,
  ]);

  useEffect(() => {
    if (redirectToConfirmed || verifying || seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [redirectToConfirmed, verifying, seconds]);

  const journey = useMemo(
    () =>
      store.journey ?? {
        train: sp.get("train") ?? "—",
        name: sp.get("name") ?? "Train",
        from: sp.get("from") ?? "",
        to: sp.get("to") ?? "",
        dep: sp.get("dep")?.slice(0, 5) ?? "",
        arr: sp.get("arr")?.slice(0, 5) ?? "",
        date: sp.get("date"),
        cls: sp.get("class") ?? "SL",
        quota: sp.get("quota") ?? "GN",
      },
    [store.journey, sp]
  );

  const count = useMemo(() => {
    if (store.passengers.length) return store.passengers.length;
    const ids = (sp.get("pax") ?? "").split(",").filter(Boolean);
    return saved.filter((p) => ids.includes(p.id)).length;
  }, [store.passengers, saved, sp]);

  const quotaLabel = QUOTA_LABEL[journey.quota] ?? journey.quota;
  const dateShort = journey.date ? fmt(journey.date, "EEE, dd MMM") : "—";
  const fare = computeFare(journey.cls, count);
  const payNow = store.totalFare ?? fare.total;
  const availability = store.availability;
  const timer = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  // Back to passenger selection for the same journey (used after a cancel/fail).
  const rebookHref = useMemo(() => {
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
    return `/book/passengers?${qs.toString()}`;
  }, [journey]);

  // Abandoned-payment mitigation: there's no backend timeout yet, so let the
  // user release the held seat themselves before leaving.
  async function cancelAndGoBack() {
    if (cancelBooking.isPending) return;
    try {
      if (bookingId) await cancelBooking.mutateAsync(bookingId);
    } catch {
    } finally {
      store.setBookingResult({
        bookingId: null,
        totalFare: null,
        availability: null,
      });
      router.push(rebookHref);
    }
  }

  // The selected method's required input must be valid before we can pay.
  const methodReady = useMemo(() => {
    switch (method) {
      case "upi":
        return VPA_RE.test(upiId.trim());
      case "card":
        return (
          cardNumber.replace(/\D/g, "").length >= 13 &&
          EXPIRY_RE.test(cardExpiry.trim()) &&
          /^\d{3,4}$/.test(cardCvv.trim()) &&
          cardName.trim().length > 1
        );
      default:
        return false;
    }
  }, [method, upiId, cardNumber, cardExpiry, cardCvv, cardName]);

  const busy = initiate.isPending || processPayment.isPending;
  const canPay =
    count > 0 && seconds > 0 && methodReady && Boolean(bookingId) && !busy;

  function buildPayload(payment_id: string): ProcessPaymentPayload {
    if (method === "card") {
      return {
        payment_id,
        payment_method: "CARD",
        card_number: cardNumber.replace(/\s+/g, ""),
        card_cvv: cardCvv.trim(),
        card_holder_name: cardName.trim(),
      };
    }
    return { payment_id, payment_method: "UPI", upi_id: upiId.trim() };
  }

  async function confirmAndPay() {
    if (!bookingId || busy) return;
    setError(null);
    try {
      // Reuse the payment from a prior attempt; otherwise create one now.
      const payment = initiate.data ?? (await initiate.mutateAsync(bookingId));
      const res = await processPayment.mutateAsync(
        buildPayload(payment.payment_id)
      );

      // Payment failed → seat released, booking cancelled. This is terminal:
      // re-paying the same booking would 422, so route the user to rebook.
      if (isPaymentFailed(res) || !isPaymentSuccess(res)) {
        setCancelledReason(
          res.failure_reason ||
            "Payment could not be completed and the booking was cancelled."
        );
        return;
      }

      // Success — note the booking may settle as confirmed / rac / waitlisted.
      store.setPayment({
        method: method === "card" ? "Card" : "UPI",
        detail:
          method === "card"
            ? `•••• ${cardNumber.replace(/\D/g, "").slice(-4)}`
            : upiId.trim(),
        txnId: res.payment_id,
        paidAt: res.paid_at,
      });
      store.setBookingStatus(res.booking_status);
      store.setPaid(bookingId, res.booking_pnr);
      store.markStepComplete(3); // payment done → Confirmed unlocks
      const qs = new URLSearchParams(sp.toString());
      qs.set("pnr", res.booking_pnr);
      if (res.booking_status) qs.set("status", res.booking_status);
      router.replace(`/book/confirmed?${qs.toString()}`);
    } catch (e) {
      setError(toApiError(e).message);
    }
  }

  if (verifying) {
    return (
      <div className="app-container-narrow py-8">
        <Card className="mx-auto mt-6 max-w-lg border-white/8 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#E8AA4D]" />
            <p className="text-muted-foreground text-sm">
              Checking your booking…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (redirectToConfirmed) {
    return (
      <div className="app-container-narrow py-8">
        <Card className="mx-auto mt-6 max-w-lg border-white/8 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#E8AA4D]" />
            <p className="text-muted-foreground text-sm">
              This booking is already paid — taking you to your ticket…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cancelledReason || serverCancelled) {
    return (
      <div className="app-container-narrow py-8">
        <Card className="mx-auto mt-6 max-w-lg border-red-500/20 bg-red-500/[0.04] shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
              <XCircle className="h-7 w-7 text-red-400" />
            </span>
            <div>
              <h1 className="font-heading text-foreground text-2xl">
                {cancelledReason ? "Payment failed" : "Booking cancelled"}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                {cancelledReason
                  ? `${cancelledReason} The held seat has been released, so you'll need to book again.`
                  : "This booking was cancelled and the held seat released — you'll need to book again."}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => router.push(rebookHref)}
                className="rounded-xl bg-[#E8AA4D] font-medium text-[#3d2817] hover:bg-[#D09840]"
              >
                <RotateCcw className="h-4 w-4" />
                Rebook
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/bookings")}
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                Go to My Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-container-narrow py-8">
      {/* Journey summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8AA4D]/20 bg-[#1f1810] px-5 py-3.5 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-[#E8AA4D]">{journey.train}</span>
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
        <BookingStepper current={3} />
      </div>

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-heading text-foreground text-4xl font-normal tracking-[-0.5px]">
              Choose payment method
            </h1>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 text-sm",
                seconds > 0 ? "text-[#E8AA4D]" : "text-red-400"
              )}
            >
              <Clock className="h-4 w-4" />
              {seconds > 0 ? `Reserved for ${timer}` : "Reservation expired"}
            </span>
          </div>

          {/* Payment methods */}
          <RadioGroup
            value={method}
            onValueChange={setMethod}
            className="gap-3"
          >
            {METHODS.map((m) => {
              const sel = method === m.id;
              const disabled = Boolean(m.disabled);
              return (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border px-5 py-4 transition-colors",
                    disabled
                      ? "bg-card/20 cursor-not-allowed border-white/8 opacity-50"
                      : sel
                        ? "cursor-pointer border-[#E8AA4D]/60 bg-[#E8AA4D]/[0.06]"
                        : "bg-card/40 cursor-pointer border-white/8 hover:border-white/15"
                  )}
                >
                  <RadioGroupItem value={m.id} disabled={disabled} />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-[15px] font-medium">
                      {m.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {m.sub}
                    </p>
                  </div>
                  {m.badge && !disabled && (
                    <Badge className="bg-emerald-500/15 text-emerald-300">
                      {m.badge}
                    </Badge>
                  )}
                  {disabled && (
                    <Badge className="text-muted-foreground bg-white/10">
                      Coming soon
                    </Badge>
                  )}
                </label>
              );
            })}
          </RadioGroup>

          {/* Method-specific panel */}
          <Card className="bg-card/40 border-white/8 shadow-none">
            <CardContent className="p-6">
              {method === "upi" && (
                <>
                  <h2 className="text-foreground text-[15px] font-medium">
                    Pay via UPI
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {UPI_APPS.map((app) => (
                      <Chip
                        key={app}
                        active={upiApp === app}
                        onClick={() => setUpiApp(app)}
                      >
                        {app}
                      </Chip>
                    ))}
                  </div>
                  <div className="mt-5 space-y-2">
                    <Label
                      htmlFor="upi-id"
                      className="text-muted-foreground text-xs tracking-[0.12em] uppercase"
                    >
                      Or enter UPI ID
                    </Label>
                    <Input
                      id="upi-id"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@bank"
                      className="h-11 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
                    />
                  </div>
                </>
              )}

              {method === "card" && (
                <>
                  <h2 className="text-foreground text-[15px] font-medium">
                    Card details
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Card number" className="sm:col-span-2">
                      <Input
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="h-11 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
                      />
                    </Field>
                    <Field label="Name on card" className="sm:col-span-2">
                      <Input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Mayank Kumar"
                        className="h-11 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
                      />
                    </Field>
                    <Field label="Expiry">
                      <Input
                        inputMode="numeric"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="h-11 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
                      />
                    </Field>
                    <Field label="CVV">
                      <Input
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="h-11 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
                      />
                    </Field>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Escrow banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#E8AA4D]/25 bg-gradient-to-r from-[#3a2a12] to-[#241a0c] px-5 py-4 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#E8AA4D]" />
            <p className="text-white/80">
              Your payment is held in escrow. If our atomic booking call fails,
              you&apos;ll be auto-refunded — no manual claim needed.
            </p>
          </div>
        </div>

        {/* ── Right column — Order summary ── */}
        <div>
          <Card className="bg-card/40 sticky top-6 border-white/8 shadow-none">
            <CardContent className="p-6">
              <h2 className="font-heading text-foreground text-lg font-medium">
                Order summary
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {journey.name} · {count} passenger{count === 1 ? "" : "s"} ·{" "}
                {journey.cls}
              </p>

              {availability && availability.toUpperCase() !== "AVAILABLE" && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Only {availability.toUpperCase()} available — paying holds a{" "}
                    {availability.toUpperCase()} seat that confirms only if it
                    clears.
                  </span>
                </div>
              )}

              <dl className="mt-5 space-y-3 text-sm">
                {store.totalFare != null ? (
                  <Row label="Total fare" value={inr(payNow)} />
                ) : (
                  <>
                    <Row label="Subtotal" value={inr(fare.subtotal)} />
                    <Row label="Charges" value={inr(fare.charges)} />
                  </>
                )}
              </dl>

              <div className="my-5 h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">Pay now</span>
                <span className="font-heading text-foreground text-2xl">
                  {inr(payNow)}
                </span>
              </div>

              {error && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={confirmAndPay}
                disabled={!canPay}
                className="mt-5 w-full cursor-pointer rounded-xl bg-[#E8AA4D] py-5 font-medium text-[#3d2817] hover:bg-[#D09840]"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {busy ? "Processing…" : "Confirm & Pay"}
              </Button>

              {/* No backend hold-timeout yet, so let the user free the seat. */}
              <Button
                variant="ghost"
                onClick={cancelAndGoBack}
                disabled={busy || cancelBooking.isPending}
                className="text-muted-foreground hover:text-foreground mt-2 w-full rounded-xl hover:bg-white/5"
              >
                {cancelBooking.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Releasing seat…
                  </>
                ) : (
                  "Cancel & go back"
                )}
              </Button>

              {!bookingId && (
                <p className="mt-3 text-center text-xs text-red-300/80">
                  Missing booking reference — start again from search.
                </p>
              )}

              <p className="text-muted-foreground mt-3 text-center text-xs">
                Powered by Razorpay · 256-bit SSL
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors",
        active
          ? "border-[#E8AA4D] text-[#E8AA4D]"
          : "text-foreground/80 border-white/12 hover:border-white/25"
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-muted-foreground text-xs tracking-[0.12em] uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmt(date: string, pattern: string) {
  const d = parseISO(date);
  return isValid(d) ? format(d, pattern) : date;
}
