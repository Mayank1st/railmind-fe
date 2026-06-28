"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useWaitlistPredictor } from "@/hooks/useWaitlistPredictor";
import {
  type WaitlistAlternative,
  type WaitlistAvailability,
  type WaitlistBucket,
  type WaitlistSignals,
} from "@/lib/waitlistPredictor";

interface WaitlistPredictorCardProps {
  pnr: string;
  sourceStationCode: string;
  destinationStationCode: string;
  trainClass: string;
  quota: string;
  enabled: boolean;
  className?: string;
}

type BucketStyle = {
  icon: LucideIcon;
  label: string;
  container: string;
  iconColor: string;
  headline: string;
  chip: string;
};

// HIGH → green (relax), MEDIUM → warm amber (keep a backup), LOW → red
// (unlikely; show alternatives). Amber matches the page accent.
const BUCKET_STYLE: Record<WaitlistBucket, BucketStyle> = {
  HIGH: {
    icon: TrendingDown,
    label: "Likely to confirm",
    container: "border-emerald-500/30 bg-emerald-500/[0.06]",
    iconColor: "text-emerald-400",
    headline: "text-emerald-300",
    chip: "bg-emerald-500/10 text-emerald-300/90",
  },
  MEDIUM: {
    icon: Clock3,
    label: "Keep a backup",
    container: "border-[#E8AA4D]/30 bg-[#E8AA4D]/[0.06]",
    iconColor: "text-[#E8AA4D]",
    headline: "text-[#F0BF6A]",
    chip: "bg-[#E8AA4D]/10 text-[#F0BF6A]/90",
  },
  LOW: {
    icon: ShieldAlert,
    label: "Unlikely to confirm",
    container: "border-red-500/30 bg-red-500/[0.07]",
    iconColor: "text-red-400",
    headline: "text-red-300",
    chip: "bg-red-500/10 text-red-300/90",
  },
};

// Live-availability badge per alternative. AVAILABLE → green (+ seat count),
// RAC → yellow, WL → amber. null availability renders no badge.
const AVAILABILITY_STYLE: Record<WaitlistAvailability, string> = {
  AVAILABLE: "bg-emerald-500/15 text-emerald-300",
  RAC: "bg-yellow-500/15 text-yellow-300",
  WL: "bg-[#E8AA4D]/15 text-[#F0BF6A]",
};

function availabilityLabel(alt: WaitlistAlternative): string | null {
  if (!alt.availability) return null;
  if (alt.availability === "AVAILABLE") {
    return alt.available_seats != null
      ? `AVL ${alt.available_seats}`
      : "Available";
  }
  return alt.availability; // "RAC" | "WL"
}

// "01:40:00" → "01:40". Defensive: returns the input if it isn't HH:mm[:ss].
function formatTime(value: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

// 470 → "7h 50m". Null/garbage → "".
function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
}

function offsetBadge(offset: number): string | null {
  if (offset === 0) return "Same day";
  if (offset > 0) return `+${offset} day`;
  return `${offset} day`;
}

// Null-safe signal chips. WAITLISTED responses populate these, but guard
// defensively so a degraded payload never renders "NaN%".
function buildSignalChips(signals: WaitlistSignals): string[] {
  const chips: string[] = [];
  if (Number.isFinite(signals.current_position)) {
    chips.push(`WL ${signals.current_position}`);
  }
  if (Number.isFinite(signals.days_to_journey)) {
    const d = signals.days_to_journey as number;
    chips.push(
      d <= 0 ? "Journey today" : d === 1 ? "1 day to go" : `${d} days to go`
    );
  }
  if (signals.route_cancel_rate != null) {
    chips.push(
      `${Math.round(signals.route_cancel_rate * 100)}% usually cancel`
    );
  }
  return chips;
}

function AlternativeRow({
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
  // Deep-link straight to the train page with full journey context (this train's
  // own date — may be ±1 day — plus the original booking's class/quota). The
  // page re-checks live availability; falls back to search if context is dropped.
  const query = new URLSearchParams({
    from: sourceStationCode,
    to: destinationStationCode,
    date: alt.journey_date,
    class: trainClass,
    quota,
  });
  const href = `/trains/${alt.train_number}?${query.toString()}`;
  const dateBadge = offsetBadge(alt.date_offset_days);
  const availability = availabilityLabel(alt);
  const duration = formatDuration(alt.duration_minutes);

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.05]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground/50 text-xs">{alt.train_number}</span>
          {availability && alt.availability && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                AVAILABILITY_STYLE[alt.availability]
              )}
            >
              {availability}
            </span>
          )}
          {dateBadge && (
            <span className="text-muted-foreground rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px]">
              {dateBadge}
            </span>
          )}
        </div>
        <p className="text-foreground mt-0.5 truncate text-sm font-medium">
          {alt.train_name}
        </p>
        <p className="text-foreground/50 mt-0.5 text-xs">
          {formatTime(alt.departs)} → {formatTime(alt.arrives)}
          {duration && ` · ${duration}`}
        </p>
      </div>
      <ArrowRight className="text-foreground/30 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function WaitlistPredictorCard({
  pnr,
  sourceStationCode,
  destinationStationCode,
  trainClass,
  quota,
  enabled,
  className,
}: WaitlistPredictorCardProps) {
  const { data, isLoading, isError } = useWaitlistPredictor(pnr, enabled);

  // Advisory only — never block the booking view. Guest/network miss → nothing.
  if (!enabled || isError) return null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "mt-6 h-[132px] animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]",
          className
        )}
      />
    );
  }

  const prediction = data?.prediction;
  if (!prediction) return null;

  // Already CNF/RAC — the page surfaces a confirmed/RAC state of its own, so the
  // predictor card stays out of the way.
  if (prediction.status === "NOT_WAITLISTED" || !prediction.bucket) return null;

  const style = BUCKET_STYLE[prediction.bucket];
  const Icon = style.icon;
  const pct =
    prediction.confirmation_probability != null
      ? Math.round(prediction.confirmation_probability * 100)
      : null;
  const signalChips = buildSignalChips(prediction.signals);
  const showAlternatives =
    prediction.suggest_alternatives && prediction.alternatives.length > 0;

  return (
    <div
      className={cn(
        "mt-6 rounded-2xl border px-5 py-4",
        style.container,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconColor)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-semibold", style.headline)}>
              {style.label}
            </span>
            {pct != null && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  style.chip
                )}
              >
                ~{pct}% chance
              </span>
            )}
            {/* Advisory only — reinforce that the final call is the user's. */}
            <span className="text-muted-foreground ml-auto text-[10px] tracking-wide uppercase">
              AI suggestion
            </span>
          </div>

          {prediction.action && (
            <p className="text-foreground/90 mt-1 text-sm font-medium">
              {prediction.action}
            </p>
          )}
          <p className="text-foreground/70 mt-1 text-sm">{prediction.reason}</p>

          {signalChips.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {signalChips.map((c) => (
                <span
                  key={c}
                  className="text-muted-foreground rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px]"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAlternatives && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent-warm h-4 w-4" />
            <p className="text-foreground/80 text-sm font-medium">
              Alternative trains
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {prediction.alternatives.map((alt) => (
              <AlternativeRow
                key={`${alt.train_number}-${alt.journey_date}`}
                alt={alt}
                sourceStationCode={sourceStationCode}
                destinationStationCode={destinationStationCode}
                trainClass={trainClass}
                quota={quota}
              />
            ))}
          </div>
        </div>
      )}

      {prediction.suggest_alternatives && !showAlternatives && (
        <div className="text-foreground/50 mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5" />
          No alternative trains found on this route.
        </div>
      )}
    </div>
  );
}
