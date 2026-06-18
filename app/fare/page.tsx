"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  CalendarIcon,
  CreditCard,
  Sparkles,
  TrainFront,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { inr, type FareClass, type FareEnquiry } from "@/lib/fare";
import { useFareEnquiry } from "@/hooks/useFareEnquiry";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StationInput from "@/components/train/StationInput";

const CLASS_NAMES: Record<string, string> = {
  SL: "Sleeper",
  "3A": "AC 3-Tier",
  "2A": "AC 2-Tier",
  "1A": "First AC",
  CC: "AC Chair Car",
  "2S": "Second Sitting",
  FC: "First Class",
  "3E": "AC 3 Economy",
};
const CLASS_OPTIONS = ["SL", "3A", "2A", "1A", "CC", "2S", "FC", "3E"];
const AC_CLASSES = ["1A", "2A", "3A", "CC", "3E", "FC", "EC", "EA"];

function inr0(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function titleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function FareEnquiryPage() {
  return (
    <Suspense fallback={<PageShell />}>
      <FareContent />
    </Suspense>
  );
}

function FareContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const train = sp.get("train") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const date = sp.get("date") ?? "";
  const clsParam = sp.get("class") ?? "2A";

  const enabled = !!(train && from && to && date);
  const params = enabled
    ? {
        train_number: train,
        source_station_code: from,
        destination_station_code: to,
        journey_date: date,
      }
    : null;
  const { data, isLoading, isError } = useFareEnquiry(params, enabled);

  // Selected class drives the breakdown. Reset to the URL's class on a new
  // search (done during render, per React guidance).
  const searchKey = `${train}|${from}|${to}|${date}`;
  const [prevKey, setPrevKey] = useState(searchKey);
  const [selected, setSelected] = useState(clsParam);
  if (searchKey !== prevKey) {
    setPrevKey(searchKey);
    setSelected(clsParam);
  }

  const fares = [...(data?.fares ?? [])].sort(
    (a, b) => a.total_fare - b.total_fare
  );
  const selectedFare =
    fares.find((f) => f.train_class === selected) ?? fares[0];

  function book(cls: string) {
    const qs = new URLSearchParams({
      from,
      to,
      class: cls,
      quota: "GN",
      ...(date ? { date } : {}),
    });
    router.push(`/trains/${train}?${qs.toString()}`);
  }

  return (
    <PageShell>
      <FareSearchBar
        train={train}
        from={from}
        to={to}
        date={date}
        cls={clsParam}
      />

      {!enabled ? (
        <EmptyState />
      ) : isLoading ? (
        <ResultsSkeleton />
      ) : isError || !data ? (
        <ErrorState />
      ) : fares.length === 0 ? (
        <Card className="bg-card/40 mt-8 border-white/8 shadow-none">
          <CardContent className="text-muted-foreground py-14 text-center text-sm">
            No fares available for this train and route.
          </CardContent>
        </Card>
      ) : (
        <>
          <TrainStrip data={data} />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            {/* All classes */}
            <div>
              <h2 className="font-heading text-foreground mb-4 text-2xl">
                All classes
              </h2>
              <div className="space-y-3">
                {fares.map((f) => (
                  <ClassCard
                    key={f.train_class}
                    fare={f}
                    selected={f.train_class === selected}
                    onSelect={() => setSelected(f.train_class)}
                    onBook={() => book(f.train_class)}
                  />
                ))}
              </div>
              <CheapestDay className="mt-4 hidden lg:flex" />
            </div>

            {/* Breakdown */}
            {selectedFare && (
              <div className="lg:sticky lg:top-6 lg:self-start">
                <Breakdown
                  fare={selectedFare}
                  onBook={() => book(selectedFare.train_class)}
                />
              </div>
            )}
          </div>

          <CheapestDay className="mt-4 flex lg:hidden" />
        </>
      )}
    </PageShell>
  );
}

/* ── Page shell with the warm hero ────────────────────────────── */

function PageShell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-[#1a1a18]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#281506_0%,#1a1a18_42%)]" />
      <div className="app-container relative z-10 py-8 sm:py-10">
        <span className="border-accent-warm/30 text-accent-warm inline-flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
          <span className="bg-accent-warm h-2 w-2 rounded-full" />
          Class-wise fare breakup
        </span>
        <h1 className="font-heading text-foreground mt-4 text-4xl font-normal tracking-[-0.5px] sm:text-5xl">
          Fare Enquiry
        </h1>
        {children}
      </div>
    </main>
  );
}

/* ── Search bar ───────────────────────────────────────────────── */

function FareSearchBar({
  train,
  from,
  to,
  date,
  cls,
}: {
  train: string;
  from: string;
  to: string;
  date: string;
  cls: string;
}) {
  const router = useRouter();
  const [trainNo, setTrainNo] = useState(train);
  const [fromCode, setFromCode] = useState(from);
  const [fromDisplay, setFromDisplay] = useState(from);
  const [toCode, setToCode] = useState(to);
  const [toDisplay, setToDisplay] = useState(to);
  const [day, setDay] = useState<Date | undefined>(
    date ? parseISO(date) : undefined
  );
  const [calOpen, setCalOpen] = useState(false);
  const [trainClass, setTrainClass] = useState(cls);

  function getFare() {
    if (!trainNo || !fromCode || !toCode || !day) return;
    const qs = new URLSearchParams({
      train: trainNo,
      from: fromCode,
      to: toCode,
      date: format(day, "yyyy-MM-dd"),
      class: trainClass,
    });
    router.push(`/fare?${qs.toString()}`);
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#121713] p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.2fr_1fr_1fr_0.9fr_0.7fr_auto] lg:items-end">
        {/* Train */}
        <Field label="Train" className="col-span-2 lg:col-span-1">
          <div className="relative">
            <TrainFront className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              value={trainNo}
              inputMode="numeric"
              maxLength={5}
              onChange={(e) => setTrainNo(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && getFare()}
              placeholder="Train number"
              className="text-foreground placeholder:text-muted-foreground focus:border-accent-warm/40 h-11 w-full rounded-lg border border-transparent bg-[#2a2a28] pl-9 text-sm outline-none"
            />
          </div>
        </Field>

        {/* From */}
        <div>
          <StationInput
            label="From"
            value={fromCode}
            displayValue={fromDisplay}
            onChange={(code, name) => {
              setFromCode(code);
              setFromDisplay(`${code} · ${name}`);
            }}
            placeholder="From"
          />
        </div>

        {/* To */}
        <div>
          <StationInput
            label="To"
            value={toCode}
            displayValue={toDisplay}
            onChange={(code, name) => {
              setToCode(code);
              setToDisplay(`${code} · ${name}`);
            }}
            placeholder="To"
          />
        </div>

        {/* Date */}
        <Field label="Journey date">
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                type="button"
                className="text-foreground h-11 w-full justify-between rounded-lg bg-[#2a2a28] px-3 text-sm font-normal hover:bg-[#333330]"
              >
                <span className="truncate">
                  {day ? format(day, "EEE, dd MMM") : "Select"}
                </span>
                <CalendarIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-white/10 bg-[#2a2a28] p-0">
              <Calendar
                mode="single"
                selected={day}
                onSelect={(d) => {
                  setDay(d);
                  setCalOpen(false);
                }}
                disabled={(d) => d < new Date(new Date().toDateString())}
                classNames={{ day_button: "cursor-pointer" }}
              />
            </PopoverContent>
          </Popover>
        </Field>

        {/* Class */}
        <Field label="Class">
          <Select value={trainClass} onValueChange={setTrainClass}>
            <SelectTrigger className="text-foreground !h-11 w-full cursor-pointer rounded-lg border-0 bg-[#2a2a28] px-3 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#2a2a28]">
              {CLASS_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Get Fare */}
        <button
          onClick={getFare}
          className="bg-accent-warm col-span-2 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium text-[#3d2817] hover:opacity-90 lg:col-span-1"
        >
          <CreditCard className="h-4 w-4" />
          Get Fare
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="text-muted-foreground mb-2 block text-xs font-medium tracking-wider uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Train strip ──────────────────────────────────────────────── */

function TrainStrip({ data }: { data: FareEnquiry }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-[#121713] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="text-accent-warm text-sm font-medium tabular-nums">
          {data.train_number}
        </span>
        <span className="text-foreground truncate text-sm font-semibold">
          {titleCase(data.train_name)}
        </span>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
        <span className="text-foreground/80 inline-flex items-center gap-1.5">
          {data.source.code}
          <ArrowRight className="h-3.5 w-3.5" />
          {data.destination.code}
        </span>
        <span className="text-white/15">·</span>
        <span className="tabular-nums">
          {data.distance_km.toLocaleString("en-IN")} km
        </span>
        <span className="text-white/15">·</span>
        <span>{fmtDate(data.journey_date)}</span>
        <span className="text-white/15">·</span>
        <span>{data.quota === "GN" ? "General" : data.quota}</span>
      </div>
    </div>
  );
}

/* ── Class card ───────────────────────────────────────────────── */

function ClassCard({
  fare,
  selected,
  onSelect,
  onBook,
}: {
  fare: FareClass;
  selected: boolean;
  onSelect: () => void;
  onBook: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors sm:gap-4 sm:p-5",
        selected
          ? "border-[#E8AA4D] bg-[#E8AA4D]/[0.06]"
          : "bg-card/40 border-white/8 hover:border-white/20"
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
          selected ? "bg-[#E8AA4D] text-[#3d2817]" : "bg-white/5 text-white/70"
        )}
      >
        {fare.train_class}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-foreground text-base font-medium">
          {CLASS_NAMES[fare.train_class] ?? fare.train_class}
        </p>
        {selected && (
          <span className="text-accent-warm mt-0.5 inline-flex items-center gap-1 text-xs font-medium">
            <span className="bg-accent-warm h-1.5 w-1.5 rounded-full" />
            Selected
          </span>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-foreground text-xl font-semibold tabular-nums sm:text-2xl">
          {inr0(fare.total_fare)}
        </p>
        <p className="text-muted-foreground text-[11px]">
          all-incl · per person
        </p>
      </div>

      <Button
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          onBook();
        }}
        className="hidden shrink-0 rounded-lg border-white/15 bg-transparent hover:bg-white/5 sm:inline-flex"
      >
        Book
      </Button>
    </div>
  );
}

/* ── Breakdown sidebar ────────────────────────────────────────── */

function Breakdown({ fare, onBook }: { fare: FareClass; onBook: () => void }) {
  const isAC = AC_CLASSES.includes(fare.train_class);
  const seniorM = fare.total_fare - 0.4 * fare.base_fare;
  const seniorF = fare.total_fare - 0.5 * fare.base_fare;
  const tatkalPremium = Math.round((isAC ? 0.3 : 0.1) * fare.base_fare);

  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <p className="text-muted-foreground text-xs">
          Breakdown · {fare.train_class}
        </p>
        <h3 className="font-heading text-foreground text-xl">
          {CLASS_NAMES[fare.train_class] ?? fare.train_class}
        </h3>

        <div className="my-5 h-px bg-white/8" />

        <dl className="space-y-3">
          <Row label="Base fare" value={inr(fare.base_fare)} />
          {fare.telescopic_discount > 0 && (
            <Row
              label="Telescopic discount"
              value={`−${inr(fare.telescopic_discount)}`}
              muted
            />
          )}
          <Row
            label="Reservation charge"
            value={inr(fare.reservation_charge)}
          />
          <Row label="Superfast charge" value={inr(fare.superfast_charge)} />
          {fare.tatkal_premium > 0 && (
            <Row label="Tatkal premium" value={inr(fare.tatkal_premium)} />
          )}
          {fare.concession_amount > 0 && (
            <Row
              label="Concession"
              value={`−${inr(fare.concession_amount)}`}
              muted
            />
          )}
          <Row label="Service charge" value={inr(fare.service_charge)} />
          <Row label="GST" value={inr(fare.gst)} />
        </dl>

        <div className="my-5 h-px bg-white/8" />

        <div className="flex items-center justify-between">
          <span className="text-foreground text-base font-medium">
            Total per person
          </span>
          <span className="font-heading text-foreground text-2xl tabular-nums">
            {inr(fare.total_fare)}
          </span>
        </div>

        <Button
          onClick={onBook}
          className="mt-5 h-12 w-full rounded-xl bg-[#E8AA4D] text-[15px] font-medium text-[#3d2817] hover:bg-[#D09840]"
        >
          Book {fare.train_class} · {inr(fare.total_fare)}
        </Button>

        {/* Concessions & variants */}
        <div className="mt-6 border-t border-white/8 pt-5">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
            Concessions & variants
          </p>
          <div className="space-y-3">
            <Variant
              title="Senior citizen (60+ M)"
              sub="40% off base"
              value={inr0(seniorM)}
            />
            <Variant
              title="Senior citizen (58+ F)"
              sub="50% off base"
              value={inr0(seniorF)}
            />
            <Variant
              title="Tatkal (window)"
              sub={`+${inr0(tatkalPremium)} premium`}
              value={inr0(fare.total_fare + tatkalPremium)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          muted ? "text-emerald-300/80" : "text-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Variant({
  title,
  sub,
  value,
}: {
  title: string;
  sub: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs">{sub}</p>
      </div>
      <span className="text-foreground shrink-0 text-sm tabular-nums">
        {value}
      </span>
    </div>
  );
}

/* ── Insight + states ─────────────────────────────────────────── */

function CheapestDay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "items-start gap-3 rounded-2xl border border-[#E8AA4D]/25 bg-gradient-to-r from-[#3a2a12] to-[#241a0c] px-5 py-4 text-sm",
        className
      )}
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#E8AA4D]" />
      <p className="text-white/80">
        <span className="font-semibold text-[#F0BF6A]">Cheapest day:</span>{" "}
        Mid-week (Tue–Thu) usually has no dynamic surge. Fares can run ~10–15%
        higher on weekends for busy routes.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-card/40 mt-8 border-white/8 shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3d2817] text-[#E8AA4D]">
          <CreditCard className="h-5 w-5" />
        </span>
        <p className="text-foreground text-base font-medium">
          See class-wise fares for any train
        </p>
        <p className="text-muted-foreground max-w-md text-sm">
          Enter the train number, route and journey date above, then hit{" "}
          <span className="text-foreground">Get Fare</span> to see the full
          per-class breakdown.
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorState() {
  return (
    <Card className="mt-8 border-red-500/20 bg-red-500/[0.04] shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <AlertCircle className="h-7 w-7 text-red-400" />
        <p className="text-foreground text-sm">
          Couldn&apos;t fetch fares. Check the train number and route, then try
          again.
        </p>
      </CardContent>
    </Card>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <div className="bg-card/40 h-12 animate-pulse rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card/40 h-20 animate-pulse rounded-2xl"
            />
          ))}
        </div>
        <div className="bg-card/40 h-96 animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return isNaN(d.getTime()) ? iso : format(d, "dd MMM yyyy");
}
