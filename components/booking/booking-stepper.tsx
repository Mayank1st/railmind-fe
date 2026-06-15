"use client";

import { Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBookingStore } from "@/store/booking";

const STEPS = [
  { label: "Passengers", path: "/book/passengers" },
  { label: "Review", path: "/book/review" },
  { label: "Payment", path: "/book/payment" },
  { label: "Confirmed", path: "/book/confirmed" },
];

export function BookingStepper({ current }: { current: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const completedStep = useBookingStore((s) => s.completedStep);

  // Being on step N means steps 1..N-1 are done; `completedStep` remembers
  // progress so you can jump forward again after going back.
  const reached = Math.max(completedStep, current - 1);

  function go(step: number, path: string) {
    if (step === current || step > reached + 1) return; // locked
    const qs = sp.toString();
    router.push(qs ? `${path}?${qs}` : path);
  }

  return (
    <div className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const step = i + 1;
        const isCurrent = step === current;
        const isCompleted = !isCurrent && step <= reached;
        const isClickable = !isCurrent && step <= reached + 1;
        return (
          <Fragment key={s.label}>
            <button
              type="button"
              onClick={() => go(step, s.path)}
              className={cn(
                "flex items-center gap-2.5",
                isClickable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-[#E8AA4D] text-[#3d2817]"
                      : "text-muted-foreground border border-white/15"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : step}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors",
                  // Mobile: only the current step shows its label (figma)
                  !isCurrent && "hidden sm:inline",
                  isCurrent || isCompleted
                    ? "text-foreground font-medium"
                    : isClickable
                      ? "text-muted-foreground hover:text-white/80"
                      : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px min-w-6 flex-1",
                  step <= reached ? "bg-[#E8AA4D]" : "bg-white/10"
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
