"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useTrainSearch } from "@/hooks/useTrainSearch";
import type { TrainClass, Train } from "@/lib/train";
import {
  ArrowRight,
  MapPin,
  Sparkles,
  Train as TrainIcon,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSeatAvailability } from "@/hooks/useSeatAvailability";
import { useAuthStore } from "@/store/auth";

// ── Train type badge colors ──
const trainTypeBadge: Record<string, string> = {
  rajdhani: "bg-amber-500/20 text-amber-400",
  shatabdi: "bg-blue-500/20 text-blue-400",
  duronto: "bg-purple-500/20 text-purple-400",
  superfast: "bg-green-500/20 text-green-400",
  express: "bg-teal-500/20 text-teal-400",
  special: "bg-pink-500/20 text-pink-400",
  passenger: "bg-gray-500/20 text-gray-400",
};

// ── Departure-time bucket definitions ──
const DEPARTURE_BUCKETS = [
  { key: "before6", label: "Before 6 AM", test: (h: number) => h < 6 },
  {
    key: "morning",
    label: "6 AM – 12 PM",
    test: (h: number) => h >= 6 && h < 12,
  },
  {
    key: "afternoon",
    label: "12 PM – 6 PM",
    test: (h: number) => h >= 12 && h < 18,
  },
  { key: "evening", label: "After 6 PM", test: (h: number) => h >= 18 },
] as const;

// ── Duration bucket definitions ──
const DURATION_BUCKETS = [
  { key: "short", label: "Under 8h", test: (m: number) => m < 8 * 60 },
  {
    key: "medium",
    label: "8h – 16h",
    test: (m: number) => m >= 8 * 60 && m < 16 * 60,
  },
  { key: "long", label: "16h+", test: (m: number) => m >= 16 * 60 },
] as const;

// ── Helpers ──
function parseHour(hms: string | undefined | null): number {
  if (!hms) return 0;
  return parseInt(hms.slice(0, 2), 10) || 0;
}

function durationMinutes(departs: string, arrives: string): number {
  if (!departs || !arrives) return 0;
  const [dh, dm] = departs.split(":").map((n) => parseInt(n, 10) || 0);
  const [ah, am] = arrives.split(":").map((n) => parseInt(n, 10) || 0);
  let diff = ah * 60 + am - (dh * 60 + dm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function formatDuration(min: number): string {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function formatDateLabel(iso: string | null): string {
  if (!iso) return "Any date";
  try {
    return format(parseISO(iso), "EEE, dd MMM");
  } catch {
    return iso;
  }
}

// ── Toggle helper ──
function toggleFilter(
  list: string[],
  setList: (next: string[]) => void,
  value: string
) {
  setList(
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  );
}

export default function TrainSearchPage() {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState("departure");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDepartures, setSelectedDepartures] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cls = searchParams.get("class") ?? "SL";
  const quota = searchParams.get("quota") ?? "GN";
  const hours = searchParams.get("hours");
  const date = searchParams.get("date");

  const payload = from
    ? {
        fromStationCode: from,
        toStationCode: to ?? undefined,
        hours: Number(hours) || 48,
        train_class: (cls as TrainClass) ?? undefined,
      }
    : null;

  const { data, isLoading, error } = useTrainSearch(payload);

  // ── Client-side filter + sort ──
  const filteredTrains = (() => {
    if (!data?.trains) return [];
    let trains = [...data.trains];

    if (selectedTypes.length > 0) {
      trains = trains.filter((t) => selectedTypes.includes(t.train_type));
    }

    if (selectedDepartures.length > 0) {
      trains = trains.filter((t) => {
        const h = parseHour(t.departs);
        return selectedDepartures.some((key) =>
          DEPARTURE_BUCKETS.find((b) => b.key === key)?.test(h)
        );
      });
    }

    if (selectedDurations.length > 0) {
      trains = trains.filter((t) => {
        const m = durationMinutes(t.departs, t.arrives);
        return selectedDurations.some((key) =>
          DURATION_BUCKETS.find((b) => b.key === key)?.test(m)
        );
      });
    }

    if (sortBy === "departure") {
      trains.sort((a, b) => a.departs.localeCompare(b.departs));
    } else if (sortBy === "arrival") {
      trains.sort((a, b) => a.arrives.localeCompare(b.arrives));
    } else if (sortBy === "duration") {
      trains.sort(
        (a, b) =>
          durationMinutes(a.departs, a.arrives) -
          durationMinutes(b.departs, b.arrives)
      );
    }

    return trains;
  })();

  // ── Counts per filter group ──
  const typeCounts = (() => {
    if (!data?.trains) return {};
    const counts: Record<string, number> = {};
    data.trains.forEach((t) => {
      counts[t.train_type] = (counts[t.train_type] || 0) + 1;
    });
    return counts;
  })();

  const departureCounts = (() => {
    const counts: Record<string, number> = {};
    if (!data?.trains) return counts;
    data.trains.forEach((t) => {
      const h = parseHour(t.departs);
      DEPARTURE_BUCKETS.forEach((b) => {
        if (b.test(h)) counts[b.key] = (counts[b.key] || 0) + 1;
      });
    });
    return counts;
  })();

  const durationCounts = (() => {
    const counts: Record<string, number> = {};
    if (!data?.trains) return counts;
    data.trains.forEach((t) => {
      const m = durationMinutes(t.departs, t.arrives);
      DURATION_BUCKETS.forEach((b) => {
        if (b.test(m)) counts[b.key] = (counts[b.key] || 0) + 1;
      });
    });
    return counts;
  })();

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedDepartures([]);
    setSelectedDurations([]);
  };

  const fromName = data?.trains?.[0]?.from_name ?? from ?? "";
  const toName = data?.trains?.[0]?.to_name ?? to ?? "";
  const dateLabel = formatDateLabel(date);

  // ── Loading ──
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#1a1a18]">
        <div className="border-b border-white/10 bg-[#1e1e1c] px-16 py-4">
          <div className="mx-auto max-w-[1400px]">
            <div className="h-6 w-96 animate-pulse rounded bg-white/5" />
          </div>
        </div>
        <div className="mx-auto flex max-w-[1400px] gap-12 px-6 py-8">
          <div className="w-64 shrink-0">
            <div className="h-96 animate-pulse rounded-xl bg-white/5" />
          </div>
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="min-h-screen bg-[#1a1a18] p-16">
        <p className="text-foreground/50">Search something first</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#1a1a18] p-16">
        <p className="text-red-400">Failed to fetch trains. Try again.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1a18]">
      {/* ── TOP BAR — Route info ── */}
      <div className="sticky top-0 z-20 bg-[#1a1a18]">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121713] px-5 py-3">
            <div className="text-foreground flex items-center gap-3 text-sm">
              <MapPin className="text-foreground/50 h-4 w-4" />
              <span className="font-medium">
                {from} <span className="text-foreground/50">{fromName}</span>
              </span>
              <ArrowRight className="text-foreground/30 h-4 w-4" />
              <span className="font-medium">
                {to} <span className="text-foreground/50">{toName}</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-foreground/50 text-sm">
                {dateLabel} · {cls} · {quota === "GN" ? "General" : quota}
              </span>
              <Link
                href="/"
                className="text-foreground cursor-pointer rounded-lg border border-white/15 px-4 py-1.5 text-sm hover:bg-white/5"
              >
                Modify
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-12 px-6 py-6">
        {/* ── LEFT SIDEBAR — Filters ── */}
        <aside className="sticky top-24 w-64 shrink-0 self-start">
          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-white/10 bg-[#1e1e1c] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-foreground text-sm font-medium">Filters</h3>
              <button
                onClick={resetFilters}
                className="text-accent-warm cursor-pointer text-xs hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Train Type */}
            <FilterSection title="Train Type">
              {Object.entries(typeCounts).map(([type, count]) => (
                <FilterCheckbox
                  key={type}
                  label={type}
                  count={count}
                  checked={selectedTypes.includes(type)}
                  onChange={() =>
                    toggleFilter(selectedTypes, setSelectedTypes, type)
                  }
                />
              ))}
            </FilterSection>

            {/* Departure */}
            <FilterSection title="Departure">
              {DEPARTURE_BUCKETS.map((b) => (
                <FilterCheckbox
                  key={b.key}
                  label={b.label}
                  count={departureCounts[b.key] ?? 0}
                  checked={selectedDepartures.includes(b.key)}
                  onChange={() =>
                    toggleFilter(
                      selectedDepartures,
                      setSelectedDepartures,
                      b.key
                    )
                  }
                  capitalize={false}
                />
              ))}
            </FilterSection>

            {/* Duration */}
            <FilterSection title="Duration">
              {DURATION_BUCKETS.map((b) => (
                <FilterCheckbox
                  key={b.key}
                  label={b.label}
                  count={durationCounts[b.key] ?? 0}
                  checked={selectedDurations.includes(b.key)}
                  onChange={() =>
                    toggleFilter(selectedDurations, setSelectedDurations, b.key)
                  }
                  capitalize={false}
                />
              ))}
            </FilterSection>

            {/* Class Available */}
            <div>
              <h4 className="text-foreground/40 mb-3 text-xs font-medium tracking-wider uppercase">
                Class Available
              </h4>
              <div className="flex flex-wrap gap-2">
                {["SL", "3A", "2A", "1A", "CC", "2S"].map((c) => (
                  <span
                    key={c}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      c === cls
                        ? "bg-accent-warm text-white"
                        : "text-foreground/50 bg-white/5"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT — Results ── */}
        <div className="flex-1">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-foreground text-3xl">
                {filteredTrains.length} trains found
              </h1>
              <p className="text-foreground/40 mt-1 text-sm">
                {fromName || from} → {toName || to} · {dateLabel}
              </p>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-foreground w-48 cursor-pointer rounded-lg border-white/10 bg-[#1e1e1c] text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#2a2a28]">
                <SelectItem value="departure">Sort: Departure</SelectItem>
                <SelectItem value="arrival">Sort: Arrival</SelectItem>
                <SelectItem value="duration">Sort: Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Smart Pick */}
          {filteredTrains.length > 0 && (
            <div className="border-accent-warm/20 bg-accent-warm/5 mb-6 flex items-start gap-3 rounded-xl border px-5 py-4">
              <Sparkles className="text-accent-warm mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-foreground/70 text-sm">
                <span className="text-foreground font-medium">
                  Smart pick:{" "}
                </span>
                {filteredTrains[0].train_number} {filteredTrains[0].train_name}{" "}
                has the highest historical confirmation rate for {cls}.
              </p>
            </div>
          )}

          {/* Train Cards */}
          <div className="space-y-4">
            {filteredTrains.map((train) => (
              <TrainCard
                key={train.train_number}
                train={train}
                selectedClass={cls}
                quota={quota}
                date={date}
              />
            ))}

            {filteredTrains.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-[#1e1e1c] p-12 text-center">
                <p className="text-foreground/50">
                  No trains match your filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Filter Section ──
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-foreground/40 mb-3 text-xs font-medium tracking-wider uppercase">
        {title}
      </h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

// ── Filter Checkbox ──
function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
  capitalize = true,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  capitalize?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <div className="flex items-center gap-2.5">
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm cursor-pointer !border-white/30 !bg-white"
        />
        <span
          className={`text-foreground/70 ${capitalize ? "capitalize" : ""}`}
        >
          {label}
        </span>
      </div>
      <span className="text-foreground/30">{count}</span>
    </label>
  );
}

// ── Train Card ──
function TrainCard({
  train,
  selectedClass,
  quota,
  date,
}: {
  train: Train;
  selectedClass: string;
  quota: string;
  date: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authStatus = useAuthStore((s) => s.status);
  const isAuthed = authStatus === "authed";

  const [expanded, setExpanded] = useState(false);
  const { data: seatData, isLoading: seatLoading } = useSeatAvailability(
    train.train_number,
    date,
    train.from_station,
    train.to_station,
    selectedClass,
    quota,
    expanded && isAuthed
  );

  const handleCheckAvailability = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthed) {
      const next = `${pathname}?${searchParams.toString()}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setExpanded(true);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(false);
  };

  const goToDetails = () => {
    const qs = new URLSearchParams({
      from: train.from_station,
      to: train.to_station,
      class: selectedClass,
      quota,
      ...(date ? { date } : {}),
    });
    router.push(`/trains/${train.train_number}?${qs.toString()}`);
  };

  const badgeClass =
    trainTypeBadge[train.train_type] ?? "bg-gray-500/20 text-gray-400";

  const daysLabel =
    train.runs_on_days?.length === 7
      ? "Daily"
      : (train.runs_on_days?.join(", ") ?? "");

  const dur = durationMinutes(train.departs, train.arrives);
  const durationLabel = formatDuration(dur);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetails();
        }
      }}
      className="group focus-visible:border-accent-warm/40 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1c] transition-colors hover:border-white/25 hover:bg-[#22221f] focus-visible:outline-none"
    >
      <div className="bg-accent-warm/40 h-1" />

      <div className="p-6">
        {/* Row 1 — Train info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-foreground/50 text-sm">
              {train.train_number}
            </span>
            <span className="text-foreground/30 text-xs">•</span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
            >
              {train.train_type}
            </span>
            <span className="text-foreground/30 text-xs">•</span>
            <span className="text-foreground/40 text-xs">{daysLabel}</span>
          </div>

          {train.runs_today && (
            <span className="text-foreground/70 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#2a2a28] px-3 py-1 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Runs today
            </span>
          )}
        </div>

        {/* Train name */}
        <div className="mt-2 inline-flex items-center gap-1.5">
          <h3 className="text-foreground group-hover:text-accent-warm text-xl font-medium transition-colors">
            {train.train_name}
          </h3>
          <ArrowRight className="text-foreground/30 group-hover:text-accent-warm h-4 w-4 transition-colors" />
        </div>

        {/* Row 2 — Timing */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-foreground text-3xl font-medium">
              {train.departs?.slice(0, 5)}
            </p>
            <p className="text-foreground/40 text-sm">{train.from_station}</p>
          </div>

          <div className="flex flex-1 flex-col items-center px-6">
            <p className="text-foreground/40 text-xs">
              {[
                durationLabel,
                train.journey_km ? `${train.journey_km} km` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="my-1.5 flex w-full items-center">
              <div className="bg-foreground/15 h-px flex-1" />
              <TrainIcon className="text-foreground/20 mx-2 h-3.5 w-3.5" />
              <div className="bg-foreground/15 h-px flex-1" />
            </div>
          </div>

          <div className="text-right">
            <p className="text-foreground text-3xl font-medium">
              {train.arrives?.slice(0, 5)}
            </p>
            <p className="text-foreground/40 text-sm">{train.to_station}</p>
          </div>
        </div>

        {/* Row 3 — Check Availability / Seat Info */}
        {!expanded ? (
          <button
            onClick={handleCheckAvailability}
            className="text-foreground/60 mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 py-3 text-sm hover:bg-white/5"
          >
            {isAuthed ? (
              <>
                Check Availability
                <ChevronDown className="h-4 w-4" />
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Login to check availability
              </>
            )}
          </button>
        ) : (
          <div className="mt-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              {seatLoading
                ? ["SL", "3A", "2A", "1A"].map((c) => (
                    <div
                      key={c}
                      className="h-16 flex-1 animate-pulse rounded-lg bg-white/5"
                    />
                  ))
                : ["SL", "3A", "2A", "1A"].map((c) => {
                    const avail = seatData?.classes?.find(
                      (s) => s.class_code === c
                    );
                    return (
                      <div
                        key={c}
                        className={`flex-1 rounded-lg border px-3 py-2.5 ${
                          c === selectedClass
                            ? "border-accent-warm/30 bg-accent-warm/10"
                            : "border-white/5 bg-white/[0.02]"
                        }`}
                      >
                        <p className="text-foreground/40 text-xs">{c}</p>
                        <p
                          className={`mt-0.5 text-sm font-medium ${
                            avail?.status === "AVL"
                              ? "text-emerald-400"
                              : avail?.status === "WL"
                                ? "text-amber-400"
                                : avail?.status === "RAC"
                                  ? "text-orange-400"
                                  : "text-foreground/40"
                          }`}
                        >
                          {avail ? `${avail.status} ${avail.count}` : "--"}
                        </p>
                      </div>
                    );
                  })}
            </div>
            <button
              onClick={handleHide}
              className="text-foreground/60 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm hover:bg-white/5"
            >
              Hide
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
