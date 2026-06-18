import { cn } from "@/lib/utils";

// Small pill that marks a feature as not-built-yet. Default styling reads on
// the dark theme; pass `className` to override colours on light surfaces (e.g.
// the amber hero card).
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#E8AA4D]/20 bg-[#E8AA4D]/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[#E8AA4D]/70",
        className
      )}
    >
      Coming soon
    </span>
  );
}
