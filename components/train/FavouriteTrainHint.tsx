"use client";

import { ArrowRight, Sparkles, Star } from "lucide-react";

import type { FavouriteTrain } from "@/lib/autofill";

interface FavouriteTrainHintProps {
  favourite: FavouriteTrain;
  smartMode: boolean;
  /** Quick-pick this train — the page decides where it leads (details vs smart book). */
  onPick: () => void;
}

/**
 * Highlighted "your usual train on this route" suggestion shown above the result
 * list. It's a one-tap shortcut — the full list below stays fully selectable, so
 * the user can always choose a different train.
 */
export function FavouriteTrainHint({
  favourite,
  smartMode,
  onPick,
}: FavouriteTrainHintProps) {
  return (
    <div className="border-accent-warm/40 bg-accent-warm/[0.08] mb-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="bg-accent-warm/15 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <Star className="text-accent-warm h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-accent-warm/80 text-xs font-medium tracking-wider uppercase">
            Your usual train on this route
          </p>
          <p className="text-foreground mt-0.5 text-base font-medium">
            {favourite.train_name}{" "}
            <span className="text-foreground/50 text-sm">
              ({favourite.train_number})
            </span>
          </p>
          <p className="text-foreground/50 text-xs">
            Booked {favourite.previous_booking_count}× · pick another train
            below anytime
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onPick}
        className="bg-accent-warm flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-[#1a1a18] hover:opacity-90"
      >
        {smartMode && <Sparkles className="h-4 w-4" />}
        {smartMode ? "Smart book" : "View & book"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
