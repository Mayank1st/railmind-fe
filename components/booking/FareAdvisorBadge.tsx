"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type FareAdvice, type FareDecision } from "@/lib/fareAdvisor";

interface FareAdvisorBadgeProps {
  advice: FareAdvice;
  // Confidence cut-off from the batch meta — below it we soften the label so a
  // low-certainty call doesn't read as a firm instruction on a glanceable card.
  threshold: number;
  className?: string;
}

type BadgeStyle = {
  dot: string;
  pill: string;
  firmLabel: string;
  softLabel: string;
};

// Same decision → colour language as the full nudge: 🔴 URGENT / 🟠 BOOK_NOW /
// 🟢 CAN_WAIT. Compact: a coloured dot + short label, no reason sentence.
const BADGE_STYLE: Record<FareDecision, BadgeStyle> = {
  URGENT: {
    dot: "bg-red-400",
    pill: "border-red-500/30 bg-red-500/10 text-red-300",
    firmLabel: "Book now",
    softLabel: "Likely book now",
  },
  BOOK_NOW: {
    dot: "bg-[#E8AA4D]",
    pill: "border-[#E8AA4D]/30 bg-[#E8AA4D]/10 text-[#F0BF6A]",
    firmLabel: "Book soon",
    softLabel: "Maybe book soon",
  },
  CAN_WAIT: {
    dot: "bg-emerald-400",
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    firmLabel: "Can wait",
    softLabel: "Probably can wait",
  },
};

export function FareAdvisorBadge({
  advice,
  threshold,
  className,
}: FareAdvisorBadgeProps) {
  const style = BADGE_STYLE[advice.decision];
  const firm = advice.confidence >= threshold;

  return (
    // The templated batch reason rides along as an instant tooltip (shadcn,
    // delayDuration 0); the full Gemini reason shows on expand via the nudge.
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
            style.pill,
            !firm && "opacity-90",
            className
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
          {firm ? style.firmLabel : style.softLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={3}
        // Match the app's black theme: override --color-popover locally so both
        // the bubble bg and the arrow fill drop to the #1e1e1c surface token.
        className="max-w-[260px] border border-white/10 text-center [--color-popover:#1e1e1c]"
      >
        {advice.reason}
      </TooltipContent>
    </Tooltip>
  );
}
