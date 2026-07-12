"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Info,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrainFront,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toApiError } from "@/lib/api";
import { bookingStatusMeta } from "@/lib/bookings";
import type {
  AdvisorRecommendation,
  AdvisorSignals,
  AdvisorStatus,
  AdvisorWaitlist,
  CancellationAdvice,
  RefundBreakdown,
  RefundLadderStep,
} from "@/lib/cancellationAdvisor";
import type {
  WaitlistAlternative,
  WaitlistBucket,
} from "@/lib/waitlistPredictor";
import { useBooking } from "@/hooks/useBooking";
import { useCancellationAdvisor } from "@/hooks/useCancellationAdvisor";
import { useCancelBooking } from "@/hooks/useCancelBooking";
import { MobileActionBar } from "@/components/booking/mobile-action-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CancellationAdvisorPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const booking = useBooking(id);
  const pnr = booking.data?.pnr_number ?? null;
  // explain=true — the advice sheet is open, so ask for the friendly reason.
  const advisor = useCancellationAdvisor(pnr);
  const cancelBooking = useCancelBooking();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const advice = advisor.data?.advice;
  const advisorEnabled = advisor.data?.advisorEnabled ?? true;
  const loading = booking.isLoading || (!!pnr && advisor.isLoading);
  const error = booking.isError
    ? booking.error
    : advisor.isError
      ? advisor.error
      : null;

  async function onCancel() {
    setCancelError(null);
    try {
      await cancelBooking.mutateAsync(id);
      setConfirmOpen(false);
      // Refetch the advice — it flips to the ALREADY_CANCELLED state with the
      // processed-refund copy.
      queryClient.invalidateQueries({
        queryKey: ["ai", "cancellation-advisor"],
      });
    } catch (e) {
      setCancelError(toApiError(e).message);
    }
  }

  return (
    // Extra bottom padding on mobile so content clears the sticky action bar.
    <div className="app-container-narrow pt-10 pb-32 lg:pb-10">
      <Link
        href={`/bookings/${id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to booking
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-4xl">
        Cancellation Advisor
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Exact refund if you cancel now, plus what we&apos;d recommend.
      </p>

      {loading ? (
        <AdvisorSkeleton />
      ) : error || !advice ? (
        <ErrorCard error={error} bookingId={id} />
      ) : (
        <div className="mt-6">
          <BookingStrip advice={advice} />

          {advice.status !== "ADVISED" ? (
            <>
              <TerminalCard status={advice.status} reason={advice.reason} />
              <MobileActionBar>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full rounded-xl border-white/12 bg-transparent text-sm font-semibold hover:bg-white/5"
                >
                  <Link href={`/bookings/${id}`}>Back to booking</Link>
                </Button>
              </MobileActionBar>
            </>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main column */}
              <div className="space-y-6 lg:col-span-2">
                {advice.recommendation ? (
                  <VerdictHero advice={advice} />
                ) : (
                  !advisorEnabled && <AdviceUnavailableNote />
                )}

                {advice.refund && <RefundNowCard refund={advice.refund} />}

                {/* Mobile: the outlook joins the main flow right after the
                    refund; on desktop it lives in the sidebar. */}
                {advice.waitlist && (
                  <div className="lg:hidden">
                    <OutlookCard waitlist={advice.waitlist} />
                  </div>
                )}

                {advice.refund_ladder.length > 0 && (
                  <RefundLadderCard steps={advice.refund_ladder} />
                )}

                {advice.signals.is_tatkal &&
                  advice.refund?.refund_amount === 0 && <TatkalNote />}

                {advice.suggest_alternatives &&
                  advice.alternatives.length > 0 && (
                    <AlternativesSection
                      alternatives={advice.alternatives}
                      sourceStationCode={
                        booking.data?.source_station_code ?? ""
                      }
                      destinationStationCode={
                        booking.data?.destination_station_code ?? ""
                      }
                      trainClass={advice.signals.train_class ?? ""}
                      quota={advice.signals.quota ?? ""}
                    />
                  )}

                {/* Mobile: signal chips close the flow; actions live in the
                    sticky bottom bar. */}
                <div className="flex flex-wrap gap-2 lg:hidden">
                  <SignalChips signals={advice.signals} />
                </div>
              </div>

              {/* Sidebar (desktop only) */}
              <div className="hidden space-y-6 lg:block">
                {advice.waitlist && <OutlookCard waitlist={advice.waitlist} />}
                <ActionCard
                  signals={advice.signals}
                  refundAmount={advice.refund?.refund_amount ?? null}
                  keepHref={`/bookings/${id}`}
                  onProceed={() => {
                    setCancelError(null);
                    setConfirmOpen(true);
                  }}
                />
              </div>

              <MobileActionBar>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-white/12 bg-transparent text-sm font-semibold hover:bg-white/5"
                >
                  <Link href={`/bookings/${id}`}>Keep my ticket</Link>
                </Button>
                <Button
                  onClick={() => {
                    setCancelError(null);
                    setConfirmOpen(true);
                  }}
                  className={cn(
                    "h-11 flex-1 rounded-xl text-sm font-semibold",
                    advice.refund?.refund_amount === 0
                      ? "text-foreground/80 bg-white/20 hover:bg-white/25"
                      : "bg-[#E89180] text-[#3A1D15] hover:bg-[#DF8270]"
                  )}
                >
                  Proceed to cancel
                </Button>
              </MobileActionBar>
            </div>
          )}
        </div>
      )}

      {/* Final confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              PNR {advice?.pnr_number} will be cancelled.
              {advice?.refund
                ? ` You'll get back ${inr0(advice.refund.refund_amount)} of ${inr0(advice.refund.total_paid)} to your original payment method (3–5 business days).`
                : " Refunds follow the cancellation policy and can take a few days."}
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                Keep booking
              </Button>
            </DialogClose>
            <Button
              onClick={onCancel}
              disabled={cancelBooking.isPending}
              className="rounded-xl bg-red-500 font-medium text-white hover:bg-red-600"
            >
              {cancelBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Cancel booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Booking strip ─────────────────────────────────────────────────────── */

function BookingStrip({ advice }: { advice: CancellationAdvice }) {
  const meta = bookingStatusMeta(advice.booking_status);
  const isCancelled = advice.booking_status.toLowerCase() === "cancelled";
  const line = [
    `PNR ${advice.pnr_number}`,
    advice.signals.train_class,
    advice.signals.quota,
    advice.signals.is_tatkal ? "Tatkal" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-card/40 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/8 px-5 py-4">
      <div className="flex items-center gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3d2817] text-[#E8AA4D]">
          <TrainFront className="h-5 w-5" />
        </span>
        <div>
          <p className="text-foreground text-sm font-semibold">Your booking</p>
          <p className="text-muted-foreground mt-0.5 font-mono text-xs">
            {line}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide",
          meta.className
        )}
      >
        {isCancelled ? "CANCELLED" : meta.short}
      </span>
    </div>
  );
}

/* ── Verdict hero ──────────────────────────────────────────────────────── */

type HeroStyle = {
  icon: LucideIcon;
  kicker: string;
  title: string;
  container: string;
  iconBox: string;
  kickerCls: string;
};

const HERO_STYLE: Record<AdvisorRecommendation, HeroStyle> = {
  HOLD: {
    icon: ShieldCheck,
    kicker: "Recommended",
    title: "Hold your ticket",
    container: "border-emerald-500/25 bg-emerald-500/[0.06]",
    iconBox: "bg-emerald-500/15 text-emerald-400",
    kickerCls: "text-emerald-300",
  },
  MONITOR: {
    icon: Clock3,
    kicker: "Re-check later",
    title: "Hard to call right now",
    container: "border-orange-400/25 bg-orange-500/[0.06]",
    iconBox: "bg-orange-500/15 text-orange-300",
    kickerCls: "text-orange-300",
  },
  CANCEL_NOW: {
    icon: CircleAlert,
    kicker: "Suggested",
    title: "Consider cancelling now",
    container: "border-red-500/30 bg-red-500/[0.08]",
    iconBox: "bg-red-400/20 text-red-300",
    kickerCls: "text-red-300",
  },
  CANCEL_EARLY: {
    icon: Clock3,
    kicker: "Time-sensitive",
    title: "Cancel early to keep more",
    container: "border-[#E8AA4D]/35 bg-[#E8AA4D]/[0.07]",
    iconBox: "bg-[#E8AA4D]/15 text-[#E8AA4D]",
    kickerCls: "text-[#E8AA4D]",
  },
};

function VerdictHero({ advice }: { advice: CancellationAdvice }) {
  const rec = advice.recommendation!;
  const style = HERO_STYLE[rec];
  const Icon = style.icon;
  const cancelBy =
    rec === "CANCEL_EARLY"
      ? (advice.refund_ladder.find((s) => s.is_current)?.cancel_by ?? null)
      : null;

  return (
    <section className={cn("rounded-2xl border", style.container)}>
      <div className="px-6 pt-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                style.iconBox
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold tracking-[0.14em] uppercase",
                style.kickerCls
              )}
            >
              {style.kicker}
            </span>
          </div>
          {rec === "MONITOR" && (
            <span className="text-muted-foreground rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px]">
              Best-effort
            </span>
          )}
        </div>

        <h2 className="font-heading text-foreground mt-3 text-3xl sm:text-4xl">
          {style.title}
        </h2>

        {cancelBy && (
          <div className="bg-background/50 mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3.5">
            <Clock3 className="text-muted-foreground h-4 w-4 shrink-0" />
            <div>
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
                Cancel by
              </p>
              <p className="mt-0.5 text-lg font-medium text-[#E8AA4D]">
                {fmtDeadline(cancelBy)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 border-t border-white/10 px-6 py-4">
        <Sparkles className="text-accent-warm mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-foreground/85 text-sm leading-relaxed">
          {advice.reason}
        </p>
      </div>
    </section>
  );
}

function AdviceUnavailableNote() {
  return (
    <div className="bg-card/40 flex items-start gap-2.5 rounded-2xl border border-white/8 px-5 py-4">
      <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-foreground/80 text-sm">
        Advice unavailable — the refund figures below are exact.
      </p>
    </div>
  );
}

function TatkalNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-[#E8AA4D]/25 bg-[#E8AA4D]/[0.06] px-5 py-4">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#E8AA4D]" />
      <p className="text-foreground/85 text-sm">
        Tatkal tickets aren&apos;t refundable — there&apos;s nothing to gain by
        cancelling. Hold on unless you truly can&apos;t travel.
      </p>
    </div>
  );
}

/* ── Refund now ────────────────────────────────────────────────────────── */

const RULE_LABEL: Record<string, string> = {
  FLAT_CHARGE: "Flat cancellation charge",
  PERCENT_25: "25% deduction",
  PERCENT_50: "50% deduction",
  NO_REFUND: "No refund",
  TATKAL_NO_REFUND: "Tatkal — non-refundable",
  CLERKAGE: "Flat clerkage",
  ZERO_FARE: "Nothing paid",
};

function RefundNowCard({ refund }: { refund: RefundBreakdown }) {
  const [open, setOpen] = useState(false);
  const zero = refund.refund_amount <= 0;
  const pct =
    refund.total_paid > 0
      ? Math.max(
          0,
          Math.min(100, (refund.refund_amount / refund.total_paid) * 100)
        )
      : 0;
  const paxCount = refund.per_passenger.length;

  return (
    <section className="bg-card/40 rounded-2xl border border-white/8 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Refund if you cancel now
        </h2>
        <span className="text-foreground/70 inline-flex items-center gap-1 text-xs">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          Exact
        </span>
      </div>

      <p className="mt-3">
        {zero ? (
          <span className="font-heading text-foreground/60 text-4xl">
            ₹0 back
          </span>
        ) : (
          <>
            <span className="font-heading text-4xl text-emerald-300">
              {inr0(refund.refund_amount)}
            </span>
            <span className="text-muted-foreground ml-2 text-base">
              of {inr0(refund.total_paid)}
            </span>
          </>
        )}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-red-900/60">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="text-muted-foreground mt-2.5 flex items-center justify-between text-sm">
        <span>You get back {inr0(refund.refund_amount)}</span>
        <span>Deduction {inr0(refund.deduction_amount)}</span>
      </div>

      {paxCount > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-foreground/80 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm transition-colors hover:bg-white/[0.05]"
          >
            <span>
              {paxCount} passenger{paxCount > 1 ? "s" : ""} · breakdown
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>

          {open && (
            <div className="mt-2 divide-y divide-white/8 rounded-xl border border-white/10 bg-white/[0.02] px-4">
              {refund.per_passenger.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="text-foreground font-medium">
                      {p.passenger_status}
                    </span>
                    <span className="text-muted-foreground rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px]">
                      {RULE_LABEL[p.rule] ?? p.rule}
                    </span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-foreground">
                      {inr0(p.refund_amount)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      of {inr0(p.fare)} · −{inr0(p.deduction_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Refund ladder ─────────────────────────────────────────────────────── */

const WINDOW_LABEL: Record<string, string> = {
  BEFORE_48H: "More than 48h before",
  H48_TO_12H: "48h – 12h before",
  H12_TO_4H: "12h – 4h before",
  UNDER_4H: "Under 4h / after chart",
};

function RefundLadderCard({ steps }: { steps: RefundLadderStep[] }) {
  return (
    <section className="bg-card/40 rounded-2xl border border-white/8 p-6">
      <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        Refund drops over time
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Cancel earlier, keep more.
      </p>

      <ol className="mt-5">
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          const zero = step.refund_amount <= 0;
          return (
            <li key={step.window} className="relative pb-3 pl-7 last:pb-0">
              {!last && (
                <span
                  aria-hidden
                  className="absolute top-4 bottom-0 left-[5px] w-px bg-white/12"
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "absolute top-2 left-0 h-[11px] w-[11px] rounded-full",
                  step.is_current
                    ? "bg-[#E8AA4D]"
                    : zero
                      ? "border-2 border-red-400 bg-transparent"
                      : "border-2 border-white/25 bg-transparent"
                )}
              />
              <div
                className={cn(
                  "flex items-center justify-between gap-4 rounded-xl px-4 py-3",
                  step.is_current
                    ? "border border-[#E8AA4D]/35 bg-[#E8AA4D]/[0.09]"
                    : "px-4"
                )}
              >
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.is_current ? "text-[#E8AA4D]" : "text-foreground"
                    )}
                  >
                    {WINDOW_LABEL[step.window] ?? step.window}
                    {step.is_current && " · now"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {step.cancel_by
                      ? `until ${fmtDeadline(step.cancel_by)}`
                      : "chart prepared"}
                  </p>
                </div>
                <p
                  className={cn(
                    "font-heading text-lg tabular-nums",
                    step.is_current
                      ? "text-[#E8AA4D]"
                      : zero
                        ? "text-red-300"
                        : "text-foreground"
                  )}
                >
                  {inr0(step.refund_amount)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── Alternatives (WL LOW) ─────────────────────────────────────────────── */

function AlternativesSection({
  alternatives,
  sourceStationCode,
  destinationStationCode,
  trainClass,
  quota,
}: {
  alternatives: WaitlistAlternative[];
  sourceStationCode: string;
  destinationStationCode: string;
  trainClass: string;
  quota: string;
}) {
  return (
    <section>
      <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        Alternative trains with space
      </h2>
      {/* Mobile: horizontal snap-scroll rail; sm+: 3-up grid. */}
      <div className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {alternatives.slice(0, 3).map((alt) => (
          <AlternativeCard
            key={`${alt.train_number}-${alt.journey_date}`}
            alt={alt}
            sourceStationCode={sourceStationCode}
            destinationStationCode={destinationStationCode}
            trainClass={trainClass}
            quota={quota}
          />
        ))}
      </div>
    </section>
  );
}

function AlternativeCard({
  alt,
  sourceStationCode,
  destinationStationCode,
  trainClass,
  quota,
}: {
  alt: WaitlistAlternative;
  sourceStationCode: string;
  destinationStationCode: string;
  trainClass: string;
  quota: string;
}) {
  // Deep-link to the train page with full journey context (this alternative's
  // own date — may be ±1 day — plus the original booking's class/quota).
  const query = new URLSearchParams({
    from: sourceStationCode,
    to: destinationStationCode,
    date: alt.journey_date,
    class: trainClass,
    quota,
  });
  const href = `/trains/${alt.train_number}?${query.toString()}`;
  const seats =
    alt.availability === "AVAILABLE" && alt.available_seats != null
      ? `${alt.available_seats} seats`
      : (alt.availability ?? null);

  return (
    <div className="bg-card/40 w-[230px] shrink-0 snap-start rounded-2xl border border-white/8 p-4 sm:w-auto sm:shrink">
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground/50 text-xs">{alt.train_number}</span>
        {seats && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              alt.availability === "AVAILABLE"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            )}
          >
            {seats}
          </span>
        )}
      </div>
      <p className="text-foreground mt-1.5 truncate text-sm font-medium">
        {alt.train_name}
      </p>
      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="font-heading text-foreground text-xl">
          {fmtTime(alt.departs)}
        </span>
        <span className="h-px flex-1 bg-white/15" />
        <span className="font-heading text-foreground text-xl">
          {fmtTime(alt.arrives)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1.5 text-xs">
        {offsetLabel(alt.date_offset_days)} · {fmtDayMonth(alt.journey_date)}
      </p>
      <Button
        asChild
        variant="outline"
        className="mt-3.5 w-full rounded-xl border-white/12 bg-transparent hover:bg-white/5"
      >
        <Link href={href}>View</Link>
      </Button>
    </div>
  );
}

/* ── Confirmation outlook (WL) ─────────────────────────────────────────── */

const BUCKET_LABEL: Record<WaitlistBucket, string> = {
  HIGH: "Likely to confirm",
  MEDIUM: "Could go either way",
  LOW: "Unlikely to confirm",
};

const BUCKET_TEXT: Record<WaitlistBucket, string> = {
  HIGH: "text-emerald-300",
  MEDIUM: "text-orange-300",
  LOW: "text-red-300",
};

const BUCKET_BAR: Record<WaitlistBucket, string> = {
  HIGH: "bg-emerald-400",
  MEDIUM: "bg-orange-400",
  LOW: "bg-red-400",
};

function OutlookCard({ waitlist }: { waitlist: AdvisorWaitlist }) {
  // Degraded (no probability) renders as a soft 50/50 "could go either way".
  const degraded = waitlist.confirmation_probability == null;
  const pct = degraded
    ? 50
    : Math.round(waitlist.confirmation_probability! * 100);
  const bucket: WaitlistBucket = degraded
    ? "MEDIUM"
    : (waitlist.bucket ?? "MEDIUM");

  return (
    <section className="bg-card/40 rounded-2xl border border-white/8 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Confirmation outlook
        </h2>
        {!degraded && waitlist.model_version && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8AA4D]/30 bg-[#E8AA4D]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#E8AA4D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8AA4D]" />
            AI prediction
          </span>
        )}
      </div>

      <p className="mt-3">
        <span className={cn("font-heading text-4xl", BUCKET_TEXT[bucket])}>
          {pct}%
        </span>
        <span className={cn("ml-2 text-sm font-medium", BUCKET_TEXT[bucket])}>
          {BUCKET_LABEL[bucket]}
        </span>
      </p>
      <p className="text-muted-foreground mt-1.5 text-sm">
        chance your waitlist confirms — this is an estimate, not a guarantee.
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full", BUCKET_BAR[bucket])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>

      {!degraded && waitlist.model_version && (
        <p className="text-muted-foreground/70 mt-3 font-mono text-xs">
          {waitlist.model_version}
        </p>
      )}
    </section>
  );
}

/* ── Actions ───────────────────────────────────────────────────────────── */

function ActionCard({
  signals,
  refundAmount,
  keepHref,
  onProceed,
}: {
  signals: AdvisorSignals;
  refundAmount: number | null;
  keepHref: string;
  onProceed: () => void;
}) {
  // Nothing to get back (e.g. Tatkal CNF) — keep cancelling possible, but drop
  // the urgent salmon styling so the button doesn't invite a pointless action.
  const zeroRefund = refundAmount != null && refundAmount <= 0;

  return (
    <section className="bg-card/40 rounded-2xl border border-white/8 p-5">
      <div className="flex flex-wrap gap-2">
        <SignalChips signals={signals} />
      </div>

      <div className="mt-4 space-y-2.5">
        <Button
          onClick={onProceed}
          className={cn(
            "h-11 w-full rounded-xl text-sm font-semibold",
            zeroRefund
              ? "text-foreground/80 bg-white/20 hover:bg-white/25"
              : "bg-[#E89180] text-[#3A1D15] hover:bg-[#DF8270]"
          )}
        >
          Proceed to cancel
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 w-full rounded-xl border-white/12 bg-transparent text-sm font-semibold hover:bg-white/5"
        >
          <Link href={keepHref}>Keep my ticket</Link>
        </Button>
      </div>
    </section>
  );
}

function SignalChips({ signals }: { signals: AdvisorSignals }) {
  const timeChip = timeToGo(signals.hours_to_departure);
  return (
    <>
      {timeChip && <SignalChip icon={Clock3} label={timeChip} />}
      {signals.train_class && (
        <SignalChip icon={TrainFront} label={signals.train_class} />
      )}
      {signals.quota && <SignalChip icon={MapPin} label={signals.quota} />}
    </>
  );
}

function SignalChip({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="text-foreground/80 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs">
      <Icon className="text-muted-foreground h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/* ── Terminal / error states ───────────────────────────────────────────── */

const TERMINAL_META: Record<
  Exclude<AdvisorStatus, "ADVISED">,
  { icon: LucideIcon; title: string; iconBox: string }
> = {
  ALREADY_CANCELLED: {
    icon: Check,
    title: "Already cancelled",
    iconBox: "bg-emerald-500/15 text-emerald-400",
  },
  NOT_CANCELLABLE: {
    icon: X,
    title: "Can't cancel this",
    iconBox: "bg-red-500/15 text-red-300",
  },
  NOT_APPLICABLE: {
    icon: Info,
    title: "Nothing to cancel yet",
    iconBox: "bg-white/10 text-foreground/70",
  },
};

function TerminalCard({
  status,
  reason,
}: {
  status: Exclude<AdvisorStatus, "ADVISED">;
  reason: string;
}) {
  const meta = TERMINAL_META[status];
  const Icon = meta.icon;
  return (
    <div className="bg-card/40 mt-6 flex flex-col items-center gap-4 rounded-2xl border border-white/8 px-6 py-16 text-center">
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          meta.iconBox
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="font-heading text-foreground text-3xl">{meta.title}</h2>
      <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
        {reason}
      </p>
    </div>
  );
}

function ErrorCard({
  error,
  bookingId,
}: {
  error: unknown;
  bookingId: string;
}) {
  const apiError = toApiError(error);
  const message =
    apiError.status === 429
      ? "Too many requests — please wait a minute and try again."
      : apiError.status === 404
        ? "PNR not found."
        : apiError.message || "Couldn't load cancellation advice.";

  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-6 py-12 text-center">
      <AlertCircle className="h-7 w-7 text-red-400" />
      <p className="text-foreground text-sm">{message}</p>
      <Button asChild variant="outline" className="rounded-xl">
        <Link href={`/bookings/${bookingId}`}>Back to booking</Link>
      </Button>
    </div>
  );
}

function AdvisorSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="bg-card/40 h-20 animate-pulse rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-card/40 h-56 animate-pulse rounded-2xl" />
          <div className="bg-card/40 h-64 animate-pulse rounded-2xl" />
        </div>
        <div className="space-y-6">
          <div className="bg-card/40 h-40 animate-pulse rounded-2xl" />
          <div className="bg-card/40 h-44 animate-pulse rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Formatting helpers ────────────────────────────────────────────────── */

// Whole-rupee INR, Indian grouping — the backend `reason` rounds the same way.
function inr0(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// "2026-07-25T15:35:00+05:30" → "Sat 25 Jul, 3:35 PM". The backend sends IST
// wall time; strip the offset and format the naive part so the display stays
// IST regardless of the viewer's timezone.
function fmtDeadline(iso: string): string {
  const naive = iso.replace(/(Z|[+-]\d{2}:?\d{2})$/, "");
  const d = parseISO(naive);
  return isValid(d) ? format(d, "EEE dd MMM, h:mm a") : iso;
}

// "16:55:00" → "16:55". Defensive: returns the input if it isn't HH:mm[:ss].
function fmtTime(value: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

// "2026-07-13" → "13/07"
function fmtDayMonth(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd/MM") : iso;
}

function offsetLabel(offset: number): string {
  if (offset === 0) return "Same day";
  return offset > 0 ? `+${offset} day` : `${offset} day`;
}

// 356.3h → "15d to go"; 20h → "20h to go". Days from 48h up.
function timeToGo(hours: number | null): string | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  if (hours >= 48) return `${Math.round(hours / 24)}d to go`;
  const h = Math.max(0, Math.round(hours));
  return `${h}h to go`;
}
