"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO, subDays } from "date-fns";
import { Radio, TrainFront } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DateOption = "today" | "tomorrow" | "yesterday" | "custom";

const DATE_OPTIONS: { key: DateOption; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "yesterday", label: "Yesterday" },
  { key: "custom", label: "Custom" },
];

const ISO = "yyyy-MM-dd";

// Asks for a train number + journey date, then routes to the live page with
// both as the URL the live-status API reads. `children` is the trigger.
// `initialTrainNumber` / `initialDate` pre-fill it (used by the "Change train"
// button on the live page).
export function LiveRunningDialog({
  children,
  initialTrainNumber = "",
  initialDate,
}: {
  children: ReactNode;
  initialTrainNumber?: string;
  initialDate?: string;
}) {
  const router = useRouter();

  const todayIso = format(new Date(), ISO);
  const tomorrowIso = format(addDays(new Date(), 1), ISO);
  const yesterdayIso = format(subDays(new Date(), 1), ISO);

  function optionFor(iso?: string): DateOption {
    if (!iso || iso === todayIso) return "today";
    if (iso === tomorrowIso) return "tomorrow";
    if (iso === yesterdayIso) return "yesterday";
    return "custom";
  }

  const [open, setOpen] = useState(false);
  const [trainNumber, setTrainNumber] = useState(initialTrainNumber);
  const [dateOption, setDateOption] = useState<DateOption>(() =>
    optionFor(initialDate)
  );
  const [customDate, setCustomDate] = useState(() =>
    initialDate && optionFor(initialDate) === "custom" ? initialDate : todayIso
  );
  const [error, setError] = useState<string | null>(null);

  function resolvedDate(): string {
    if (dateOption === "tomorrow") return tomorrowIso;
    if (dateOption === "yesterday") return yesterdayIso;
    if (dateOption === "custom") return customDate;
    return todayIso;
  }

  // True while the chosen date is already today — there's nothing to switch to,
  // so "Today" stays disabled until another option is picked.
  const onToday = resolvedDate() === todayIso;

  function prettyDate(): string | null {
    const d = parseISO(resolvedDate());
    return isNaN(d.getTime()) ? null : format(d, "EEE, dd MMM yyyy");
  }

  // Reset the form to the current props every time the dialog opens.
  function handleOpenChange(next: boolean) {
    if (next) {
      setTrainNumber(initialTrainNumber);
      setDateOption(optionFor(initialDate));
      setCustomDate(
        initialDate && optionFor(initialDate) === "custom"
          ? initialDate
          : todayIso
      );
      setError(null);
    }
    setOpen(next);
  }

  function submit() {
    const t = trainNumber.trim();
    if (!t) {
      setError("Enter a train number to track.");
      return;
    }
    if (dateOption === "custom" && !customDate) {
      setError("Pick a journey date.");
      return;
    }
    setError(null);
    setOpen(false);
    router.push(`/live/${encodeURIComponent(t)}?date=${resolvedDate()}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-2xl font-normal">
            <Radio className="text-accent-warm h-5 w-5" />
            Live train status
          </DialogTitle>
          <DialogDescription>
            Enter the train number and journey date to see where it is right
            now.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          {/* Train number */}
          <div className="space-y-2">
            <Label
              htmlFor="live-train-number"
              className="text-muted-foreground text-xs tracking-[0.1em] uppercase"
            >
              Train number
            </Label>
            <div className="relative">
              <TrainFront className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="live-train-number"
                value={trainNumber}
                inputMode="numeric"
                maxLength={5}
                onChange={(e) =>
                  setTrainNumber(e.target.value.replace(/\D/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="e.g. 12951"
                className="h-11 bg-[#2a2a28] pl-9 text-[15px] dark:bg-[#2a2a28]"
              />
            </div>
          </div>

          {/* Journey date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs tracking-[0.1em] uppercase">
              Journey date
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {DATE_OPTIONS.map((o) => {
                // "Today" is locked while the chosen date already is today.
                const locked = o.key === "today" && onToday;
                return (
                  <button
                    key={o.key}
                    type="button"
                    disabled={locked}
                    onClick={() => setDateOption(o.key)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                      dateOption === o.key
                        ? "border-[#E8AA4D] bg-[#E8AA4D]/10 text-[#E8AA4D]"
                        : "text-muted-foreground hover:text-foreground border-white/10 bg-white/[0.03] hover:border-white/20",
                      locked
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer"
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>

            {dateOption === "custom" && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-2 h-11 bg-[#2a2a28] text-[15px] [color-scheme:dark] dark:bg-[#2a2a28]"
              />
            )}

            {prettyDate() && (
              <p className="text-muted-foreground text-xs">{prettyDate()}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            onClick={submit}
            className="h-11 w-full rounded-xl bg-[#E8AA4D] text-[15px] font-medium text-[#3d2817] hover:bg-[#D09840]"
          >
            <Radio className="h-4 w-4" />
            Track live
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
