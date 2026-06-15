"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Search } from "lucide-react";
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { type BookingFilter, type Journey } from "@/lib/bookings";
import { useBookingsList } from "@/hooks/useBookingsList";
import { useBookingCounts } from "@/hooks/useBookingCounts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TABS: { key: BookingFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 6;

export default function AllBookingsPage() {
  const [filter, setFilter] = useState<BookingFilter>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const counts = useBookingCounts();
  const { data, isLoading, isError, isPlaceholderData } = useBookingsList(
    filter,
    page,
    PAGE_SIZE
  );

  const journeys = data?.journeys ?? [];
  const meta = data?.meta;

  const q = search.trim().toLowerCase();
  const rows = q
    ? journeys.filter((j) =>
        `${j.pnr_number} ${j.train_number} ${j.train_name}`
          .toLowerCase()
          .includes(q)
      )
    : journeys;

  function changeFilter(next: BookingFilter) {
    setFilter(next);
    setPage(1);
    setSearch("");
  }

  return (
    <div className="app-container py-10">
      <h1 className="font-heading text-foreground text-4xl font-normal tracking-[-0.5px] sm:text-5xl">
        My bookings
      </h1>

      {/* Tabs — scroll horizontally within their own strip on narrow screens
          instead of widening the whole page. */}
      <div className="mt-8 overflow-x-auto border-b border-white/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="-mb-px flex w-max items-center gap-1">
          {TABS.map((t) => {
            const active = t.key === filter;
            const count = counts[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => changeFilter(t.key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="font-medium">{t.label}</span>
                {count != null && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                      active
                        ? "bg-[#E8AA4D] text-[#3d2817]"
                        : "text-muted-foreground bg-white/10"
                    )}
                  >
                    {count}
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#E8AA4D]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search PNR or train"
          className="text-foreground placeholder:text-muted-foreground h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] pr-3 pl-9 text-sm focus:border-white/25 focus:outline-none sm:max-w-xs"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <Card className="mt-6 border-red-500/20 bg-red-500/[0.04] shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-7 w-7 text-red-400" />
            <p className="text-foreground text-sm">
              Couldn&apos;t load your bookings.
            </p>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="bg-card/40 mt-6 border-white/8 shadow-none">
          <CardContent className="text-muted-foreground py-14 text-center text-sm">
            {q
              ? "No bookings match your search."
              : "No bookings in this category yet."}
          </CardContent>
        </Card>
      ) : (
        <ul
          className={cn(
            "mt-6 space-y-3 transition-opacity",
            isPlaceholderData && "opacity-60"
          )}
        >
          {rows.map((j) => (
            <BookingRow key={j.booking_id} journey={j} />
          ))}
        </ul>
      )}

      {/* Pagination — hidden while a client-side search is narrowing one page */}
      {!q && meta && meta.pages > 1 && (
        <Pagination page={meta.page} pages={meta.pages} onPage={setPage} />
      )}
    </div>
  );
}

type Phase = {
  accent: string;
  badge: string;
  badgeClass: string;
};

function phaseMeta(j: Journey): Phase {
  if (j.booking_status === "cancelled") {
    return {
      accent: "bg-red-500/70",
      badge: "Cancelled",
      badgeClass: "border border-red-500/20 bg-red-500/15 text-red-300",
    };
  }
  const d = parseISO(j.journey_date);
  const upcoming = isValid(d) && differenceInCalendarDays(d, new Date()) >= 0;
  if (upcoming) {
    return {
      accent: "bg-[#E8AA4D]",
      badge: `Upcoming · ${relativeDay(j.journey_date)}`,
      badgeClass: "border border-[#E8AA4D]/25 bg-[#E8AA4D]/15 text-[#E8AA4D]",
    };
  }
  return {
    accent: "bg-[#E8AA4D]/50",
    badge: "Completed",
    badgeClass:
      "border border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
  };
}

function BookingRow({ journey: j }: { journey: Journey }) {
  const phase = phaseMeta(j);
  return (
    <li>
      <div className="bg-card/40 hover:bg-card/60 flex items-stretch overflow-hidden rounded-xl border border-white/8 transition-colors hover:border-white/15">
        <span className={cn("w-1 shrink-0", phase.accent)} />
        <div className="flex flex-1 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-muted-foreground font-mono text-xs">
                {j.pnr_number}
              </span>
              <p className="text-foreground text-sm font-medium">
                {j.train_number} {formatTrainName(j.train_name)}
              </p>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDate(j.journey_date)} · {j.source_station} →{" "}
              {j.destination_station}
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase",
                phase.badgeClass
              )}
            >
              {phase.badge}
            </span>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5"
            >
              <Link href={`/bookings/${j.booking_id}`}>
                View
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  const items = pageItems(page, pages);
  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <PageButton
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        label="Previous page"
      >
        ‹
      </PageButton>
      {items.map((it, i) =>
        it === "…" ? (
          <span
            key={`gap-${i}`}
            className="text-muted-foreground px-2 text-sm select-none"
          >
            …
          </span>
        ) : (
          <PageButton
            key={it}
            active={it === page}
            onClick={() => onPage(it)}
            label={`Page ${it}`}
          >
            {it}
          </PageButton>
        )
      )}
      <PageButton
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        label="Next page"
      >
        ›
      </PageButton>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm tabular-nums transition-colors",
        active
          ? "bg-[#E8AA4D] font-medium text-[#3d2817]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );
}

// Windowed page list with ellipses, e.g. 1 … 4 5 6 … 12.
function pageItems(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

function ListSkeleton() {
  return (
    <ul className="mt-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="bg-card/40 h-[72px] animate-pulse rounded-xl" />
      ))}
    </ul>
  );
}

function relativeDay(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return "";
  const diff = differenceInCalendarDays(d, new Date());
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1) return `in ${diff} days`;
  if (diff === -1) return "yesterday";
  return `${Math.abs(diff)} days ago`;
}

function formatDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEE, dd MMM yyyy") : iso;
}

function formatTrainName(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
