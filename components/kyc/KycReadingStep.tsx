"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * The bar is honest about the part we can measure and smooth about the part we
 * cannot: the upload owns the first 35% (real bytes, from axios), then the
 * vision call eases toward a 92% ceiling and only completes when the response
 * lands. No frozen spinner, and no bar that sits at 99% lying about it.
 */
const UPLOAD_SHARE = 35;
const READ_CEILING = 92;
const READ_TIME_CONSTANT = 2600; // ms — 1 - e^(-t/τ); ~92% of the way by 6s
const TICK_MS = 120;

interface KycReadingStepProps {
  documentLabel: string;
  /** Local object URL of the picked photo — never the backend `document_path`. */
  previewUrl: string | null;
  /** Real upload progress, 0–100. */
  uploadPercent: number;
  onCancel: () => void;
}

export function KycReadingStep({
  documentLabel,
  previewUrl,
  uploadPercent,
  onCancel,
}: KycReadingStepProps) {
  const uploaded = uploadPercent >= 100;
  const [readProgress, setReadProgress] = useState(0); // 0–1

  useEffect(() => {
    if (!uploaded) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setReadProgress(1 - Math.exp(-elapsed / READ_TIME_CONSTANT));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [uploaded]);

  const percent = uploaded
    ? Math.round(UPLOAD_SHARE + readProgress * (READ_CEILING - UPLOAD_SHARE))
    : Math.round((Math.max(0, uploadPercent) / 100) * UPLOAD_SHARE);

  const phases = [
    { label: "Photo uploaded", done: uploaded, active: !uploaded },
    { label: "Details read from the card", done: false, active: uploaded },
    { label: "Ready for you to check", done: false, active: false },
  ];

  return (
    <div>
      <h2 className="font-heading text-foreground text-3xl sm:text-[34px]">
        Reading your card
      </h2>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        This usually takes about five seconds. Please keep this page open.
      </p>

      <div className="relative mt-6 h-40 overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.06] to-transparent sm:h-44">
        {previewUrl ? (
          // A local object URL, so next/image would only add loader overhead.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${documentLabel} — front`}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-6 font-mono text-xs">
            <span>{documentLabel}</span>
            <span>— front</span>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-foreground text-sm font-semibold">
            Reading the {documentLabel} card
          </p>
          <p className="text-muted-foreground text-sm tabular-nums">
            {percent}%
          </p>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={`Reading the ${documentLabel} card`}
          className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="bg-accent-warm h-full rounded-full transition-[width] duration-150 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2.5">
          {phases.map((phase) => (
            <li key={phase.label} className="flex items-center gap-2.5">
              {phase.done ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <span
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-full border",
                    phase.active ? "border-accent-warm" : "border-white/20"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-[13px]",
                  phase.done
                    ? "text-white/80"
                    : phase.active
                      ? "text-white/70"
                      : "text-muted-foreground"
                )}
              >
                {phase.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant="outline"
        onClick={onCancel}
        className="mt-6 h-10 rounded-lg border-white/12 bg-transparent px-5 text-sm font-medium hover:bg-white/[0.04]"
      >
        Cancel
      </Button>
    </div>
  );
}
