"use client";

import { CircleAlert, Info, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * `attention` (amber) = something needs the user's input but the flow is fine.
 * `blocked` (red) = a file we genuinely cannot accept.
 * `privacy` = the quiet reassurance note.
 */
export type KycNoticeVariant = "attention" | "blocked" | "privacy";

interface KycNoticeProps {
  variant: KycNoticeVariant;
  title?: string;
  children: React.ReactNode;
  /** Buttons / links rendered under the copy. */
  actions?: React.ReactNode;
  className?: string;
}

const ICONS = {
  attention: Info,
  blocked: CircleAlert,
  privacy: ShieldCheck,
} as const;

const SHELL = {
  attention: "border-accent-warm/30 bg-accent-warm/[0.07]",
  blocked: "border-red-500/30 bg-red-500/[0.08]",
  privacy: "border-accent-warm/15 bg-accent-warm/[0.04]",
} as const;

const ICON_TONE = {
  attention: "text-accent-warm",
  blocked: "text-red-400",
  privacy: "text-accent-warm",
} as const;

const TITLE_TONE = {
  attention: "text-accent-warm",
  blocked: "text-red-300",
  privacy: "text-foreground",
} as const;

export function KycNotice({
  variant,
  title,
  children,
  actions,
  className,
}: KycNoticeProps) {
  const Icon = ICONS[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5",
        SHELL[variant],
        className
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", ICON_TONE[variant])} />
      <div className="min-w-0 flex-1">
        {title && (
          <p className={cn("text-sm font-semibold", TITLE_TONE[variant])}>
            {title}
          </p>
        )}
        <div
          className={cn(
            "text-white/70",
            variant === "privacy"
              ? "text-[13px] leading-relaxed"
              : "text-[13px]",
            title && "mt-1"
          )}
        >
          {children}
        </div>
        {actions && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
