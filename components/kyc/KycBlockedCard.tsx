"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { formatCountdown } from "@/lib/kyc";
import { Button } from "@/components/ui/button";

interface KycBlockedCardProps {
  title: string;
  description: string;
  /**
   * Seconds to wait before a retry is allowed (RM-RATE-001 carries this in its
   * message). `null` means retry immediately — the RM-KYC-004 case.
   */
  retryAfterSeconds: number | null;
  onRetry: () => void;
  onManualEntry: () => void;
}

/**
 * The two states where the reader is out of reach: the vision service failed
 * (RM-KYC-004) or the 5-per-minute limit is spent (RM-RATE-001). Both keep
 * manual entry open, because neither is the user's fault and both are temporary.
 */
export function KycBlockedCard({
  title,
  description,
  retryAfterSeconds,
  onRetry,
  onManualEntry,
}: KycBlockedCardProps) {
  // Seeded once. The caller gives this component a fresh `key` per blocker, so
  // a new wait always arrives as a remount rather than a prop sync.
  const [remaining, setRemaining] = useState(retryAfterSeconds ?? 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const waiting = remaining > 0;

  return (
    <div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="bg-accent-warm/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <Clock className="text-accent-warm h-4 w-4" />
          </span>
          <h2 className="text-foreground text-base font-semibold sm:text-lg">
            {title}
          </h2>
        </div>

        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {description}
        </p>

        {waiting && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-white/70">You can try again in</span>
            <span
              aria-live="polite"
              className="text-foreground font-mono text-xl tabular-nums"
            >
              {formatCountdown(remaining)}
            </span>
          </div>
        )}

        <Button
          onClick={onRetry}
          disabled={waiting}
          className="bg-accent-warm hover:bg-accent-warm/90 mt-4 h-11 w-full rounded-lg text-sm font-medium text-[#3d2817]"
        >
          Try again
        </Button>
        <Button
          variant="outline"
          onClick={onManualEntry}
          className="mt-3 h-11 w-full rounded-lg border-white/12 bg-transparent text-sm font-medium hover:bg-white/[0.04]"
        >
          Enter the details manually
        </Button>
      </div>

      <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
        Manual entry goes through the same admin review. Nothing you have typed
        so far is lost.
      </p>
    </div>
  );
}
