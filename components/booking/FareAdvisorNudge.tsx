"use client";

import {
  AlertTriangle,
  Clock3,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useFareAdvisor } from "@/hooks/useFareAdvisor";
import {
  type BookingVelocity,
  type FareAdvisorParams,
  type FareAdvisorSignals,
  type FareDecision,
} from "@/lib/fareAdvisor";

interface FareAdvisorNudgeProps {
  params: FareAdvisorParams;
  // Gate the underlying query (logged-in + journey resolved). When false the
  // nudge renders nothing and never fires the request.
  enabled: boolean;
  className?: string;
}

type DecisionStyle = {
  icon: LucideIcon;
  firmHeadline: string;
  softHeadline: string;
  container: string;
  iconColor: string;
  headline: string;
};

// URGENT → red (act immediately), BOOK_NOW → warm amber (filling fast),
// CAN_WAIT → green (no rush). Amber matches the page's accent; red/green use
// the same Tailwind palette as the search-result train-type badges.
const DECISION_STYLE: Record<FareDecision, DecisionStyle> = {
  URGENT: {
    icon: AlertTriangle,
    firmHeadline: "Book now",
    softHeadline: "You may want to book now",
    container: "border-red-500/30 bg-red-500/[0.07]",
    iconColor: "text-red-400",
    headline: "text-red-300",
  },
  BOOK_NOW: {
    icon: TrendingUp,
    firmHeadline: "Book soon",
    softHeadline: "You may want to book soon",
    container: "border-[#E8AA4D]/30 bg-[#E8AA4D]/[0.06]",
    iconColor: "text-[#E8AA4D]",
    headline: "text-[#F0BF6A]",
  },
  CAN_WAIT: {
    icon: Clock3,
    firmHeadline: "No rush — you can wait",
    softHeadline: "You can probably wait",
    container: "border-emerald-500/30 bg-emerald-500/[0.06]",
    iconColor: "text-emerald-400",
    headline: "text-emerald-300",
  },
};

const VELOCITY_LABEL: Record<BookingVelocity, string> = {
  HIGH: "High demand",
  MODERATE: "Moderate demand",
  LOW: "Low demand",
};

// Compact, null-safe chips from the decision signals (fill rate / waitlist can
// be null when there's no live inventory — skip them, don't render "NaN%").
function buildChips(signals: FareAdvisorSignals): string[] {
  const chips: string[] = [];
  if (signals.fill_rate != null) {
    chips.push(`${Math.round(signals.fill_rate * 100)}% full`);
  }
  if (Number.isFinite(signals.days_to_journey)) {
    chips.push(
      signals.days_to_journey < 0
        ? "Date passed"
        : signals.days_to_journey === 0
          ? "Travels today"
          : `${signals.days_to_journey}d to journey`
    );
  }
  chips.push(VELOCITY_LABEL[signals.booking_velocity]);
  if (signals.waitlist_pressure != null && signals.waitlist_pressure > 0) {
    chips.push(`WL ${Math.round(signals.waitlist_pressure * 100)}%`);
  }
  return chips;
}

export function FareAdvisorNudge({
  params,
  enabled,
  className,
}: FareAdvisorNudgeProps) {
  const { data, isLoading, isError } = useFareAdvisor(params, enabled);

  // Advisory only — on a guest/network miss, just show nothing.
  if (!enabled || isError) return null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "mt-4 h-[76px] animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]",
          className
        )}
      />
    );
  }

  const advice = data?.advice;
  if (!advice) return null;

  const style = DECISION_STYLE[advice.decision];
  const Icon = style.icon;
  // confidence >= threshold → firm nudge; below → soften the wording so a
  // low-certainty call doesn't break trust.
  const firm = advice.confidence >= (data?.threshold ?? 0.75);
  const headline = firm ? style.firmHeadline : style.softHeadline;
  const chips = buildChips(advice.signals);

  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm",
        style.container,
        className
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconColor)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", style.headline)}>
            {headline}
          </span>
          {!firm && (
            <span className="text-muted-foreground text-[11px]">
              low certainty
            </span>
          )}
          {/* Advisory only — a nudge, never a blocker. */}
          <span className="text-muted-foreground ml-auto text-[10px] tracking-wide uppercase">
            AI suggestion
          </span>
        </div>
        <p className="mt-1 text-white/80">{advice.reason}</p>
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((c) => (
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
  );
}
