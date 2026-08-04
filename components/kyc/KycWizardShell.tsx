"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = ["Capture", "Confirm", "Review"];

interface KycWizardShellProps {
  /** 1-based — which of the three steps is showing. */
  step: number;
  backHref: string;
  children: React.ReactNode;
}

/**
 * The framed shell every KYC step renders inside: header, step counter and the
 * three-segment progress rail.
 */
export function KycWizardShell({
  step,
  backHref,
  children,
}: KycWizardShellProps) {
  return (
    <div className="app-container-narrow py-8 sm:py-10">
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#111110]">
        <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Link
              href={backHref}
              aria-label="Back to profile"
              className="text-muted-foreground hover:text-foreground mt-0.5 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-foreground text-base font-semibold sm:text-lg">
                KYC verification
              </h1>
              <p className="text-muted-foreground mt-0.5 text-xs sm:text-[13px]">
                Profile · Identity document
              </p>
            </div>
          </div>
          <p className="text-muted-foreground font-mono text-xs whitespace-nowrap sm:text-[13px]">
            Step {step} of {STEPS.length}
          </p>
        </header>

        <div
          className="grid gap-x-3 border-b border-white/8 px-5 pb-3 sm:px-7"
          style={{
            gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))`,
          }}
        >
          {STEPS.map((label, i) => {
            const reached = i + 1 <= step;
            return (
              <div key={label}>
                <div
                  className={cn(
                    "h-[2px] rounded-full transition-colors",
                    reached ? "bg-accent-warm" : "bg-white/10"
                  )}
                />
                <p
                  className={cn(
                    "mt-2 text-[11px] sm:text-xs",
                    i + 1 === step
                      ? "text-accent-warm font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-8 sm:px-7 sm:py-10">
          <div className="mx-auto w-full max-w-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
