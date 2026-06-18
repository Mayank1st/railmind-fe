"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Clock,
  RefreshCw,
  Sparkles,
  TrainFront,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { type LiveRouteStop, type LiveStatus } from "@/lib/live";
import { useLiveStatus } from "@/hooks/useLiveStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { LiveRunningDialog } from "@/components/live/live-running-dialog";

const LOGO = "/images/browser_tab_logo.png";

export default function LiveStatusPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LiveContent />
    </Suspense>
  );
}

function LiveContent() {
  const params = useParams();
  const search = useSearchParams();
  const trainNumber = String(params.trainNumber ?? "");
  const date = search.get("date") || format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, isError, refetch, isFetching } = useLiveStatus(
    trainNumber,
    date
  );

  if (isLoading) return <LoadingState />;

  if (isError || !data) {
    return (
      <main className="app-container py-10">
        <TrainSwitcher trainNumber={trainNumber} date={date} />
        <Card className="mt-6 border-red-500/20 bg-red-500/[0.04] shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="h-7 w-7 text-red-400" />
            <p className="text-foreground text-sm">
              Couldn&apos;t load live status for train {trainNumber}.
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="rounded-xl border-white/15 bg-transparent hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="app-container py-6 sm:py-8">
      {/* Desktop header — on mobile the global navbar covers nav, the hero
          carries a compact refresh. */}
      <div className="hidden lg:block">
        <Header
          data={data}
          date={date}
          onRefresh={() => refetch()}
          refreshing={isFetching}
        />
      </div>

      <HeroCard
        data={data}
        date={date}
        onRefresh={() => refetch()}
        refreshing={isFetching}
      />

      {/* Mobile: delay forecast sits right under the hero */}
      <div className="mt-4 lg:hidden">
        <DelayForecast data={data} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:mt-6 lg:grid-cols-[1fr_340px]">
        <Timeline data={data} />
        <aside className="hidden space-y-4 lg:block">
          <NextHaltCard data={data} />
          <DelayForecast data={data} />
          <JourneyStatsCard data={data} />
          <ArrivalAlerts />
        </aside>
      </div>

      {/* Mobile: arrival alerts after the timeline */}
      <div className="mt-4 lg:hidden">
        <ArrivalAlerts />
      </div>
    </main>
  );
}

/* ── Header: train switcher + refresh ─────────────────────────── */

function Header({
  data,
  date,
  onRefresh,
  refreshing,
}: {
  data: LiveStatus;
  date: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const reported = parseReportedInstant(data.last_reported_at);
  const ago = reported
    ? formatDistanceToNowStrict(reported, { addSuffix: true })
    : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <TrainSwitcher
        trainNumber={data.train_number}
        trainName={data.train_name}
        date={date}
      />

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {ago && (
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Updated {ago}
            {data.is_stale && (
              <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                stale
              </span>
            )}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="text-accent-warm flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium hover:underline disabled:opacity-60"
        >
          {refreshing ? (
            <Spinner className="size-3.5" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </div>
    </div>
  );
}

function TrainSwitcher({
  trainNumber,
  trainName,
  date,
}: {
  trainNumber: string;
  trainName?: string;
  date: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-card/40 flex min-w-0 items-center gap-2 rounded-xl border border-white/8 px-4 py-2.5">
        <TrainFront className="text-accent-warm h-4 w-4 shrink-0" />
        <span className="text-foreground truncate text-sm font-medium">
          {trainNumber}
          {trainName ? ` · ${titleCase(trainName)}` : ""}
        </span>
      </div>
      <LiveRunningDialog initialTrainNumber={trainNumber} initialDate={date}>
        <Button
          variant="outline"
          className="shrink-0 rounded-xl border-white/15 bg-transparent hover:bg-white/5"
        >
          Change train
        </Button>
      </LiveRunningDialog>
    </div>
  );
}

/* ── Hero: status, name, route + animated track ───────────────── */

function HeroCard({
  data,
  date,
  onRefresh,
  refreshing,
}: {
  data: LiveStatus;
  date: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const d = derive(data);
  const delay = data.current_delay_minutes ?? 0;
  const onTime = delay <= 0;

  const statusBadge = (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        onTime
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-[#3a2a12] text-[#E8AA4D]"
      )}
    >
      {onTime ? "On time" : `Running ${delay} min late`}
    </span>
  );

  return (
    <Card className="bg-card/40 border-white/8 shadow-none lg:mt-6">
      <CardContent className="p-5 sm:p-7">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground text-sm tabular-nums">
                {data.train_number}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-red-300 uppercase">
                <span className="rm-live-dot h-1.5 w-1.5 rounded-full bg-red-400" />
                Live
              </span>
            </div>
            <h1 className="font-heading text-foreground mt-1.5 text-3xl font-normal sm:text-[42px]">
              {titleCase(data.train_name)}
            </h1>
            <p className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
              {fmtDate(date)}
              <span className="text-white/20">·</span>
              <span className="inline-flex items-center gap-1.5">
                {d.first?.station_code}
                <ArrowRight className="h-3.5 w-3.5" />
                {d.last?.station_code}
              </span>
            </p>
            {/* Mobile: status badge on its own row */}
            <div className="mt-3 lg:hidden">{statusBadge}</div>
          </div>

          {/* Mobile: compact refresh */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh"
            className="text-muted-foreground hover:text-foreground flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-60 lg:hidden"
          >
            {refreshing ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>

          {/* Desktop: status + stats */}
          <div className="hidden flex-col items-end gap-3 lg:flex">
            {statusBadge}
            <div className="flex items-center gap-6">
              <Stat
                label="Covered"
                value={`${Math.round(d.coveredKm)}`}
                unit="km"
              />
              <Stat
                label="Avg speed"
                value={d.avg != null ? `${d.avg}` : "—"}
                unit={d.avg != null ? "km/h" : ""}
              />
            </div>
          </div>
        </div>

        {/* Animated track */}
        <Track d={d} />

        {/* Mobile: Speed / Next / In */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-white/8 overflow-hidden rounded-xl border border-white/8 lg:hidden">
          <StatCell
            label="Speed"
            value={d.avg != null ? `${d.avg} km/h` : "—"}
          />
          <StatCell
            label="Next"
            value={d.nextHalt ? shortStation(d.nextHalt) : "—"}
          />
          <StatCell
            label="In"
            value={d.etaMin != null && d.etaMin > 0 ? `${d.etaMin} min` : "—"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Track({ d }: { d: Derived }) {
  const pct = d.pct;
  return (
    <div className="mt-9">
      <div
        className="relative h-2 rounded-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 15px)",
        }}
      >
        {/* Covered rail + running spark */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-[#E8AA4D]/80 to-[#E8AA4D] shadow-[0_0_14px_rgba(232,170,77,0.5)]"
          style={{ width: `${pct}%` }}
        >
          <span
            className="rm-track-spark absolute inset-y-0 w-12"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
            }}
          />
        </div>

        {/* Origin / destination caps */}
        <span className="absolute top-1/2 left-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8AA4D]" />
        <span className="absolute top-1/2 right-0 h-3.5 w-3.5 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25 bg-[#1a1a18]" />

        {/* Moving train badge — wrapper centers (always), inner span rocks */}
        <div
          className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${clamp(pct, 2, 98)}%` }}
        >
          <span className="rm-badge-roll block aspect-square h-11 w-11 overflow-hidden rounded-full shadow-[0_0_18px_rgba(232,170,77,0.45),0_4px_12px_rgba(0,0,0,0.55)] ring-2 ring-[#E8AA4D]/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="" className="h-full w-full object-cover" />
          </span>
        </div>
      </div>

      {/* Endpoint + current labels */}
      <div className="mt-5 flex items-start justify-between gap-2 sm:mt-6">
        <div className="min-w-0">
          <p className="font-heading text-foreground text-base sm:text-lg">
            {d.first?.station_code}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            <span className="hidden sm:inline">
              {titleCase(d.first?.station_name ?? "")} ·{" "}
            </span>
            {fmtTime(d.first?.scheduled_departure)}
          </p>
        </div>

        <div className="min-w-0 flex-1 px-1 text-center">
          {/* Mobile: compact */}
          <p className="text-accent-warm truncate text-xs font-medium tabular-nums sm:hidden">
            {stationLabel(d.current)} · {Math.round(pct)}%
          </p>
          {/* Desktop: full */}
          <p className="text-accent-warm hidden text-sm font-medium sm:block">
            Departed {stationLabel(d.current)}
          </p>
          <p className="text-muted-foreground hidden text-xs tabular-nums sm:block">
            {Math.round(d.coveredKm)} / {Math.round(d.totalKm)} km ·{" "}
            {Math.round(pct)}%
          </p>
        </div>

        <div className="min-w-0 text-right">
          <p className="font-heading text-foreground text-base sm:text-lg">
            {d.last?.station_code}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            <span className="hidden sm:inline">
              {titleCase(d.last?.station_name ?? "")} ·{" "}
            </span>
            {fmtTime(d.last?.scheduled_arrival)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Station-by-station timeline ──────────────────────────────── */

function Timeline({ data }: { data: LiveStatus }) {
  const route = sortedRoute(data);
  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-foreground text-xl">
            Station-by-station
          </h2>
          <span className="text-muted-foreground text-xs">
            Actual vs scheduled · {route.length} halts
          </span>
        </div>

        <ol>
          {route.map((s, i) => (
            <StationRow
              key={`${s.station_code}-${i}`}
              stop={s}
              isFirst={i === 0}
              isLast={i === route.length - 1}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function StationRow({
  stop: s,
  isFirst,
  isLast,
}: {
  stop: LiveRouteStop;
  isFirst: boolean;
  isLast: boolean;
}) {
  const actual = s.actual_arrival ?? s.actual_departure;
  const scheduled = s.scheduled_arrival ?? s.scheduled_departure;
  const showStruck = scheduled && actual && scheduled !== actual;
  // Some live-report points (e.g. auto pings) come with no station name — fall
  // back to the code so the row never renders a blank title.
  const name = titleCase(s.station_name).trim();
  const displayName = name || s.station_code;
  const showCode =
    !!name && name.toUpperCase() !== s.station_code.toUpperCase();

  return (
    <li className="flex gap-3">
      {/* Times */}
      <div className="w-12 shrink-0 pt-0.5 text-right">
        <p className="text-foreground text-sm tabular-nums">
          {fmtTime(actual ?? scheduled)}
        </p>
        {showStruck && (
          <p className="text-muted-foreground text-xs tabular-nums line-through">
            {fmtTime(scheduled)}
          </p>
        )}
      </div>

      {/* Node + connector — one continuous line behind, node centered on top
          at y=12px so it stays connected regardless of node size. */}
      <div className="relative w-7 shrink-0 self-stretch">
        {!isFirst && (
          <span className="absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white/12" />
        )}
        {!isLast && (
          <span className="absolute top-3 bottom-0 left-1/2 w-px -translate-x-1/2 bg-white/12" />
        )}

        {s.is_current ? (
          <span className="absolute top-3 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="rm-pulse-ring absolute inset-0 rounded-full border-2 border-[#E8AA4D]" />
            <span className="relative block aspect-square h-7 w-7 overflow-hidden rounded-full shadow-[0_0_12px_rgba(232,170,77,0.4)] ring-2 ring-[#E8AA4D]/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" className="h-full w-full object-cover" />
            </span>
          </span>
        ) : (
          <span
            className={cn(
              "absolute top-3 left-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
              s.is_departed
                ? "bg-[#E8AA4D]"
                : "border-2 border-white/25 bg-[#1a1a18]"
            )}
          />
        )}
      </div>

      {/* Station info */}
      <div className="min-w-0 flex-1 pb-7">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-foreground text-sm font-medium">{displayName}</p>
          {showCode && (
            <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
              {s.station_code}
            </span>
          )}
          {s.is_current && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-red-300 uppercase">
              <span className="rm-live-dot h-1 w-1 rounded-full bg-red-400" />
              Live
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {s.platform_number ? `Platform ${s.platform_number}` : "Platform —"}
          {s.day_number ? ` · Day ${s.day_number}` : ""}
        </p>
      </div>

      {/* Delay badge */}
      <div className="shrink-0 pt-0.5">
        <DelayBadge stop={s} />
      </div>
    </li>
  );
}

function DelayBadge({ stop }: { stop: LiveRouteStop }) {
  const d = stop.arrival_delay_minutes ?? stop.departure_delay_minutes ?? 0;
  if (d <= 0) {
    if (!stop.is_departed) return null;
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-300 uppercase">
        <span className="sm:hidden">OT</span>
        <span className="hidden sm:inline">On time</span>
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#E8AA4D]/20 bg-[#E8AA4D]/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#E8AA4D] uppercase tabular-nums">
      +{d} M
    </span>
  );
}

/* ── Sidebar cards (reused standalone on mobile) ──────────────── */

function NextHaltCard({ data }: { data: LiveStatus }) {
  const d = derive(data);
  const next = d.nextHalt;
  if (!next) return null;
  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5">
        <p className="text-muted-foreground text-xs">Next halt</p>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3d2817] text-[#E8AA4D]">
            <TrainFront className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-foreground text-lg leading-tight">
              {stationLabel(next)}
            </p>
            <p className="text-muted-foreground text-xs tabular-nums">
              ETA {fmtTime(next.actual_arrival ?? next.scheduled_arrival)}
              {d.etaMin != null && d.etaMin > 0 ? ` · in ${d.etaMin} min` : ""}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Platform" value={next.platform_number ?? "—"} />
          <MiniStat
            label="Halt"
            value={next.halt_minutes ? `${next.halt_minutes} min` : "—"}
          />
          <MiniStat
            label="Delay"
            value={`+${next.arrival_delay_minutes ?? 0}m`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DelayForecast({ data }: { data: LiveStatus }) {
  const d = derive(data);
  const delay = data.current_delay_minutes ?? 0;
  const dest = titleCase(d.last?.station_name ?? "destination");
  const expected =
    d.last?.scheduled_arrival && delay > 0
      ? addMinutes(d.last.scheduled_arrival, delay)
      : d.last?.scheduled_arrival;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#E8AA4D]/25 bg-gradient-to-r from-[#3a2a12] to-[#241a0c] px-5 py-4 text-sm">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#E8AA4D]" />
      <p className="text-white/80">
        <span className="font-semibold text-[#F0BF6A]">Delay forecast:</span>{" "}
        {delay > 0 ? (
          <>
            Expected at {dest}{" "}
            <span className="text-foreground font-medium tabular-nums">
              {expected}
            </span>{" "}
            (+{delay} min).
          </>
        ) : (
          <>
            On track. Expected at {dest}{" "}
            <span className="text-foreground font-medium tabular-nums">
              {expected}
            </span>
            .
          </>
        )}
      </p>
    </div>
  );
}

function JourneyStatsCard({ data }: { data: LiveStatus }) {
  const d = derive(data);
  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5">
        <h3 className="text-foreground text-sm font-semibold">Journey stats</h3>
        <dl className="mt-3 space-y-2.5">
          <StatRow
            label="Distance covered"
            value={`${Math.round(d.coveredKm)} km`}
          />
          <StatRow
            label="Distance left"
            value={`${Math.round(Math.max(0, d.totalKm - d.coveredKm))} km`}
          />
          <StatRow
            label="Avg speed"
            value={d.avg != null ? `${d.avg} km/h` : "—"}
          />
          <StatRow
            label="Stations crossed"
            value={`${d.crossed} of ${d.route.length}`}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function ArrivalAlerts() {
  return (
    <div>
      <Button
        variant="outline"
        disabled
        className="w-full rounded-xl border-white/12 bg-transparent py-5 text-sm hover:bg-white/5"
      >
        <Bell className="h-4 w-4" />
        Get arrival alerts
      </Button>
      <div className="mt-2 flex justify-center">
        <ComingSoonBadge />
      </div>
    </div>
  );
}

/* ── Small presentational bits ────────────────────────────────── */

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground mt-0.5 text-2xl font-medium tabular-nums">
        {value}
        {unit && (
          <span className="text-muted-foreground ml-1 text-xs font-normal">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2 py-2 text-center">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="text-foreground mt-0.5 text-sm font-medium tabular-nums">
        {value}
      </p>
    </div>
  );
}

// Hero's mobile Speed / Next / In cells.
function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-2.5 text-center">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="text-foreground mt-0.5 truncate text-sm font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

// Display name for a stop, falling back to the code when the name is missing
// (auto-report points sometimes have no name).
function stationLabel(s?: LiveRouteStop): string {
  if (!s) return "";
  return titleCase(s.station_name).trim() || s.station_code;
}

function shortStation(s?: LiveRouteStop): string {
  const label = stationLabel(s);
  return label.split(/\s+/)[0] || label;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="app-container py-10">
      <div className="space-y-6">
        <div className="bg-card/40 h-10 w-72 animate-pulse rounded-xl" />
        <div className="bg-card/40 h-64 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="bg-card/40 h-96 animate-pulse rounded-2xl" />
          <div className="bg-card/40 h-96 animate-pulse rounded-2xl" />
        </div>
      </div>
    </main>
  );
}

/* ── Derivation + formatting helpers ──────────────────────────── */

type Derived = {
  route: LiveRouteStop[];
  first?: LiveRouteStop;
  last?: LiveRouteStop;
  current?: LiveRouteStop;
  nextHalt?: LiveRouteStop;
  totalKm: number;
  coveredKm: number;
  pct: number;
  crossed: number;
  avg: number | null;
  etaMin: number | null;
};

function derive(data: LiveStatus): Derived {
  const route = sortedRoute(data);
  const first = route[0];
  const last = route[route.length - 1];
  const totalKm = last?.distance_km ?? 0;

  // Everything keys off the live position so the hero matches the timeline: the
  // current stop sets covered distance + progress, and "crossed" counts the
  // stops before it. (is_departed flags alone aren't reliable — some feeds mark
  // still-future stops as departed.)
  let currentIdx = route.findIndex((s) => s.is_current);
  if (currentIdx < 0) {
    for (let i = route.length - 1; i >= 0; i--) {
      if (route[i].is_departed) {
        currentIdx = i;
        break;
      }
    }
  }
  if (currentIdx < 0) currentIdx = 0;

  const current = route[currentIdx];
  const crossed = currentIdx;
  const nextHalt = route[currentIdx + 1];

  const reportedNaive = parseReportedNaive(data.last_reported_at);
  // The current stop may be a 0-km auto-report point — estimate how far along it
  // is by time between the surrounding stops so covered/%/speed aren't all 0.
  const coveredKm = coveredDistance(route, currentIdx, reportedNaive);
  const pct = totalKm > 0 ? clamp((coveredKm / totalKm) * 100, 0, 100) : 0;

  const avg = avgSpeed(
    data.journey_date,
    first?.actual_departure ?? first?.scheduled_departure ?? null,
    reportedNaive,
    coveredKm
  );
  const etaMin =
    reportedNaive && nextHalt
      ? minutesUntil(
          reportedNaive,
          nextHalt.actual_arrival ?? nextHalt.scheduled_arrival
        )
      : null;

  return {
    route,
    first,
    last,
    current,
    nextHalt,
    totalKm,
    coveredKm,
    pct,
    crossed,
    avg,
    etaMin,
  };
}

// How far the train has run. Normally the current stop's distance; if that stop
// is a 0-km auto-report point, interpolate between the surrounding stops by time
// so the figure (and the % / avg speed derived from it) stays believable.
function coveredDistance(
  route: LiveRouteStop[],
  currentIdx: number,
  reportedNaive: Date | null
): number {
  const cur = route[currentIdx];
  if (!cur) return 0;
  if (cur.distance_km > 0) return cur.distance_km;
  if (currentIdx <= 0) return 0;

  const prev = route[currentIdx - 1];
  const dPrev = prev?.distance_km ?? 0;
  // Next stop that's actually further along the line.
  let n = currentIdx + 1;
  while (n < route.length && route[n].distance_km <= dPrev) n++;
  const nextStop = route[n];
  if (!nextStop) return dPrev;
  const dNext = nextStop.distance_km;

  const reportedMin = reportedNaive
    ? reportedNaive.getHours() * 60 + reportedNaive.getMinutes()
    : null;
  const tPrev = stopMinutes(
    prev.actual_departure ?? prev.actual_arrival ?? prev.scheduled_departure
  );
  const tNext = stopMinutes(
    nextStop.actual_arrival ?? nextStop.scheduled_arrival
  );
  const tCur =
    stopMinutes(cur.actual_arrival ?? cur.actual_departure) ?? reportedMin;

  if (tPrev != null && tNext != null && tCur != null) {
    let span = tNext - tPrev;
    if (span <= 0) span += 1440; // crossed midnight
    let elapsed = tCur - tPrev;
    if (elapsed < 0) elapsed += 1440;
    const frac = clamp(span > 0 ? elapsed / span : 0, 0, 1);
    return Math.round(dPrev + frac * (dNext - dPrev));
  }
  return dPrev;
}

function stopMinutes(t?: string | null): number | null {
  if (!t || !/^\d{1,2}:\d{2}/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
}

function sortedRoute(data: LiveStatus): LiveRouteStop[] {
  return [...(data.route ?? [])].sort(
    (a, b) => a.sequence_number - b.sequence_number
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function fmtTime(t?: string | null): string {
  return t && /^\d{1,2}:\d{2}/.test(t) ? t.slice(0, 5) : "—";
}

function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return isNaN(d.getTime()) ? iso : format(d, "EEE, dd MMM yyyy");
}

function titleCase(s: string): string {
  return s
    .replace(/~+$/g, "")
    .trim()
    .split(/\s+/)
    .map((w) =>
      w.length <= 3 && w === w.toUpperCase()
        ? w
        : w[0]?.toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(" ");
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const total = (((h * 60 + m + mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`;
}

// last_reported_at "2026-06-15 14:53:00 +0530" → real instant (for "ago").
function parseReportedInstant(s: string): Date | null {
  const norm = s.replace(" ", "T").replace(/\s+/g, "");
  const d = new Date(norm);
  return isNaN(d.getTime()) ? null : d;
}

// Same string, but the local naive date+time (matches the tz-less HH:MM stops).
function parseReportedNaive(s: string): Date | null {
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5])
  );
}

function avgSpeed(
  journeyDate: string,
  firstDeparture: string | null,
  reportedNaive: Date | null,
  coveredKm: number
): number | null {
  if (!reportedNaive || !firstDeparture || coveredKm <= 0) return null;
  const [h, m] = firstDeparture.split(":").map(Number);
  const start = parseReportedNaive(`${journeyDate} ${firstDeparture}`);
  if (start == null || Number.isNaN(h) || Number.isNaN(m)) return null;
  const hrs = (reportedNaive.getTime() - start.getTime()) / 3_600_000;
  if (hrs <= 0.1) return null;
  return Math.round(coveredKm / hrs);
}

function minutesUntil(
  reportedNaive: Date,
  etaTime?: string | null
): number | null {
  if (!etaTime) return null;
  const [h, m] = etaTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const eta = new Date(reportedNaive);
  eta.setHours(h, m, 0, 0);
  if (eta.getTime() < reportedNaive.getTime() - 60_000) {
    eta.setDate(eta.getDate() + 1);
  }
  const mins = Math.round((eta.getTime() - reportedNaive.getTime()) / 60_000);
  return mins >= 0 ? mins : null;
}
