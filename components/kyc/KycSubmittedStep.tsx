"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Check, TrainFront } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KycSubmittedStepProps {
  documentLabel: string;
  /** Label for the number panel, e.g. "Aadhaar number". */
  numberLabel: string;
  /** Masked — only the last four digits, exactly as the backend returns it. */
  maskedNumber: string;
  details: { label: string; value: string }[];
  submittedAt: Date;
  onReplace: () => void;
  backHref: string;
}

export function KycSubmittedStep({
  documentLabel,
  numberLabel,
  maskedNumber,
  details,
  submittedAt,
  onReplace,
  backHref,
}: KycSubmittedStepProps) {
  const timeline = [
    {
      state: "done" as const,
      title: "Submitted by you",
      detail: `Today, ${format(submittedAt, "h:mm aaa")}`,
    },
    {
      state: "current" as const,
      title: "Admin review",
      detail:
        "Usually within 24 working hours. We will let you know as soon as it is done.",
    },
    {
      state: "todo" as const,
      title: "Verified",
      detail: "Quota and Tatkal bookings unlock at this point.",
    },
  ];

  return (
    <div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-foreground text-3xl sm:text-[32px]">
            Sent for review
          </h2>
          <span className="border-accent-warm/30 bg-accent-warm/15 text-accent-warm shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-wider uppercase">
            Pending review
          </span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          You are not verified yet. An officer checks it manually.
        </p>

        <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {numberLabel}
          </p>
          <p className="text-foreground mt-1.5 font-mono text-xl tracking-wide sm:text-2xl">
            {maskedNumber}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Only the last four digits are shown from now on.
          </p>
        </div>

        <dl className="mt-2 divide-y divide-white/8">
          {details.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-foreground text-right">{row.value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-muted-foreground">Submitted</dt>
            <dd className="text-foreground text-right">
              {format(submittedAt, "d MMM yyyy, h:mm aaa")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6">
        <p className="text-foreground text-sm font-semibold">
          What happens next
        </p>
        <ol className="mt-4 space-y-5">
          {timeline.map((item, i) => (
            <li key={item.title} className="relative flex gap-3">
              {i < timeline.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-6 left-[9px] h-[calc(100%+4px)] w-px bg-white/10"
                />
              )}
              <span
                className={cn(
                  "relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2",
                  item.state === "done"
                    ? "border-emerald-400 bg-emerald-400"
                    : item.state === "current"
                      ? "border-accent-warm bg-[#111110]"
                      : "border-white/20 bg-[#111110]"
                )}
              >
                {item.state === "done" && (
                  <Check className="h-3 w-3 text-[#0d2b1d]" strokeWidth={3} />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  {item.title}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-accent-warm/20 bg-accent-warm/[0.05] mt-4 flex items-start gap-3 rounded-xl border px-4 py-3.5">
        <TrainFront className="text-accent-warm mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-[13px] leading-relaxed text-white/70">
          You can keep booking general tickets while this is pending. Quota and
          Tatkal bookings open up once an officer approves your {documentLabel}.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button
          variant="outline"
          onClick={onReplace}
          className="h-10 rounded-lg border-white/12 bg-transparent px-4 text-sm font-medium hover:bg-white/[0.04]"
        >
          Replace document
        </Button>
        <Link
          href={backHref}
          className="text-accent-warm text-sm font-medium hover:underline"
        >
          Back to profile
        </Link>
      </div>
    </div>
  );
}
