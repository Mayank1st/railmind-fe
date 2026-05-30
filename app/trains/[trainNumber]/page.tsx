"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { useTrainDetails } from "@/hooks/useTrainDetails";
import { useTrainSchedule } from "@/hooks/useTrainSchedule";
import { useSeatAvailability } from "@/hooks/useSeatAvailability";
import { useAuthStore } from "@/store/auth";
import type { TrainCoach, TrainScheduleStop } from "@/lib/train";
import { CoachLayout } from "@/components/train/CoachLayout";

const trainTypeBadge: Record<string, string> = {
  rajdhani: "bg-amber-500/20 text-amber-400",
  shatabdi: "bg-blue-500/20 text-blue-400",
  duronto: "bg-purple-500/20 text-purple-400",
  superfast: "bg-green-500/20 text-green-400",
  express: "bg-teal-500/20 text-teal-400",
  special: "bg-pink-500/20 text-pink-400",
  passenger: "bg-gray-500/20 text-gray-400",
};

const classLabels: Record<string, string> = {
  SL: "Sleeper",
  "3A": "AC 3-Tier",
  "2A": "AC 2-Tier",
  "1A": "First AC",
  CC: "AC Chair Car",
  "2S": "Second Sitting",
  FC: "First Class",
  "3E": "AC 3 Economy",
};

const quotaLabels: Record<string, string> = {
  GN: "General",
  TQ: "Tatkal",
  PT: "Premium Tatkal",
  LD: "Ladies",
  LB: "Lower Berth",
  HP: "Handicapped",
  DF: "Defence",
  SS: "Senior Citizen",
  FT: "Foreign Tourist",
};

const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const TABS = [
  { key: "schedule", label: "Schedule" },
  { key: "seat-availability", label: "Seat Availability" },
  { key: "coach-layout", label: "Coach Layout" },
  { key: "fare-breakdown", label: "Fare Breakdown" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function formatTime(hms: string | null | undefined): string {
  if (!hms) return "—";
  return hms.slice(0, 5);
}

function formatDuration(min: number): string {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function computeDays(schedule: TrainScheduleStop[]): number[] {
  const days: number[] = [];
  let day = 1;
  let prevDep = "";
  schedule.forEach((stop, idx) => {
    if (idx > 0 && stop.arrival < prevDep) {
      day++;
    }
    days.push(day);
    prevDep = stop.departure;
  });
  return days;
}

function isDayActive(dayKey: string, runsOn: string[] | undefined): boolean {
  if (!runsOn || runsOn.length === 0 || runsOn.length === 7) return true;
  return runsOn.some((d) => d.toUpperCase().startsWith(dayKey.slice(0, 3)));
}

function uniqueClasses(coaches: TrainCoach[]): {
  class_code: string;
  total_seats: number;
}[] {
  const map = new Map<string, number>();
  coaches.forEach((c) => {
    map.set(c.train_class, (map.get(c.train_class) ?? 0) + c.total_seats);
  });
  return Array.from(map.entries()).map(([class_code, total_seats]) => ({
    class_code,
    total_seats,
  }));
}

export default function TrainDetailPage() {
  const params = useParams<{ trainNumber: string }>();
  const trainNumber = params.trainNumber;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const cls = searchParams.get("class") ?? "SL";
  const quota = searchParams.get("quota") ?? "GN";
  const date = searchParams.get("date");

  const [activeTab, setActiveTab] = useState<TabKey>("schedule");

  const { data: schedule, isLoading: scheduleLoading } =
    useTrainSchedule(trainNumber);
  const { data: details, isLoading: detailsLoading } =
    useTrainDetails(trainNumber);

  const authStatus = useAuthStore((s) => s.status);
  const isAuthed = authStatus === "authed";
  const canFetchSeats = isAuthed && !!from && !!to && !!date;

  const { data: seatData, isLoading: seatsLoading } = useSeatAvailability(
    trainNumber,
    date,
    from,
    to,
    cls,
    quota,
    canFetchSeats
  );

  const stops = useMemo(() => schedule?.schedule ?? [], [schedule]);
  const dayMap = useMemo(() => computeDays(stops), [stops]);
  const src = stops[0];
  const dst = stops[stops.length - 1];
  const totalKm = dst?.distance_km ?? 0;
  const durationMin = useMemo(() => {
    if (stops.length < 2) return 0;
    const startMin =
      parseInt(src.departure.slice(0, 2), 10) * 60 +
      parseInt(src.departure.slice(3, 5), 10);
    const endMin =
      parseInt(dst.arrival.slice(0, 2), 10) * 60 +
      parseInt(dst.arrival.slice(3, 5), 10);
    const dayDelta = (dayMap[stops.length - 1] - dayMap[0]) * 24 * 60;
    return endMin - startMin + dayDelta;
  }, [stops, dayMap, src, dst]);

  const dateLabel = date ? format(parseISO(date), "EEE, dd MMM") : null;

  const classes = useMemo(
    () => (details?.coaches ? uniqueClasses(details.coaches) : []),
    [details]
  );

  const seatClassMap = useMemo(() => {
    const map: Record<string, { status: string; count: number }> = {};
    seatData?.classes?.forEach((c) => {
      map[c.class_code] = { status: c.status, count: c.count };
    });
    return map;
  }, [seatData?.classes]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/trains/search");
    }
  };

  const handleBook = (classCode: string) => {
    if (!isAuthed) {
      const next = `${pathname}?${searchParams.toString()}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    const qs = new URLSearchParams({
      train: trainNumber,
      class: classCode,
      quota,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(date ? { date } : {}),
    });
    router.push(`/bookings/new?${qs.toString()}`);
  };

  if (scheduleLoading || detailsLoading) {
    return (
      <main className="min-h-screen bg-[#1a1a18]">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-white/5" />
            <div className="h-48 animate-pulse rounded-xl bg-white/5" />
            <div className="flex gap-8">
              <div className="h-96 flex-1 animate-pulse rounded-xl bg-white/5" />
              <div className="h-96 w-80 animate-pulse rounded-xl bg-white/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!schedule || !details) {
    return (
      <main className="min-h-screen bg-[#1a1a18]">
        <div className="mx-auto max-w-[800px] px-6 py-24 text-center">
          <h1 className="text-foreground text-2xl">Train not found</h1>
          <p className="text-foreground/50 mt-2">
            We couldn&apos;t find details for train {trainNumber}.
          </p>
          <Link
            href="/trains/search"
            className="bg-accent-warm mt-6 inline-block rounded-lg px-6 py-3 text-sm font-medium text-white"
          >
            Back to search
          </Link>
        </div>
      </main>
    );
  }

  const badgeClass =
    trainTypeBadge[schedule.train_type] ?? "bg-gray-500/20 text-gray-400";

  const halts = Math.max(0, schedule.total_stops - 2);

  return (
    <main className="min-h-screen bg-[#1a1a18]">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {/* ── Back link ── */}
        <button
          onClick={handleBack}
          className="text-foreground/60 hover:text-foreground mb-5 inline-flex cursor-pointer items-center gap-2 text-sm underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to results
        </button>

        {/* ── Train hero card ── */}
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1c]">
          <div className="bg-accent-warm/40 h-1" />
          <div className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-foreground/60 font-medium">
                    {schedule.train_number}
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
                  >
                    {schedule.train_type} Express
                  </span>
                  <span className="text-foreground/30">·</span>
                  <span className="text-foreground/50">
                    {schedule.runs_on_days?.length === 0 ||
                    schedule.runs_on_days?.length === 7
                      ? "Runs Daily"
                      : `Runs ${schedule.runs_on_days?.join(", ")}`}
                  </span>
                  {totalKm > 0 && (
                    <>
                      <span className="text-foreground/30">·</span>
                      <span className="text-foreground/50">
                        {totalKm.toLocaleString()} km
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-foreground mt-4 text-[42px] leading-[1.1] font-normal tracking-[-0.5px]">
                  {schedule.train_name}
                </h1>

                {src && dst && (
                  <p className="text-foreground/60 mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-foreground/80">
                      {src.station_name}
                    </span>
                    <ArrowRight className="text-foreground/30 h-3.5 w-3.5" />
                    <span className="text-foreground/80">
                      {dst.station_name}
                    </span>
                    {durationMin > 0 && (
                      <>
                        <span className="text-foreground/30">·</span>
                        <span>{formatDuration(durationMin)}</span>
                      </>
                    )}
                    <span className="text-foreground/30">·</span>
                    <span>{halts} halts</span>
                  </p>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {DAY_KEYS.map((key, idx) => {
                      const active = isDayActive(key, schedule.runs_on_days);
                      return (
                        <span
                          key={`${key}-${idx}`}
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${
                            active
                              ? "bg-accent-warm text-white"
                              : "bg-white/5 text-white/30"
                          }`}
                        >
                          {DAY_LETTERS[idx]}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-foreground/40 text-sm">
                    {schedule.runs_on_days?.length === 0 ||
                    schedule.runs_on_days?.length === 7
                      ? "Runs every day of the week"
                      : `Runs ${schedule.runs_on_days?.length} days a week`}
                  </span>
                </div>
              </div>

              {/* Right side — context chip */}
              <div className="flex flex-col items-end gap-3">
                {seatData?.availability_status === "AVL" && (
                  <span className="border-accent-warm/30 bg-accent-warm/10 text-accent-warm inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                    <span className="bg-accent-warm h-1.5 w-1.5 rounded-full" />
                    High confirmation chance
                  </span>
                )}
                {(cls || quota || dateLabel) && (
                  <div className="text-foreground/50 text-right text-xs">
                    <p className="text-foreground/40 tracking-wider uppercase">
                      For
                    </p>
                    <p className="text-foreground/80 mt-1 text-sm">
                      {cls} · {quotaLabels[quota] ?? quota}
                      {dateLabel ? ` · ${dateLabel}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Two-column layout ── */}
        <div className="mt-6 flex gap-6">
          {/* Left — Tabs + content */}
          <div className="min-w-0 flex-1">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/10">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative cursor-pointer px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "text-accent-warm"
                      : "text-foreground/50 hover:text-foreground/80"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="bg-accent-warm absolute right-0 -bottom-px left-0 h-0.5" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="mt-6">
              {activeTab === "schedule" && (
                <ScheduleTable stops={stops} dayMap={dayMap} />
              )}
              {activeTab === "seat-availability" && (
                <SeatAvailabilityPanel
                  classes={classes}
                  seatClassMap={seatClassMap}
                  isLoading={seatsLoading}
                  canFetch={canFetchSeats}
                  isAuthed={isAuthed}
                />
              )}
              {activeTab === "coach-layout" && (
                <CoachLayout
                  coaches={details.coaches}
                  defaultClass={cls}
                  fromCode={from}
                  toCode={to}
                  date={date}
                />
              )}
              {activeTab === "fare-breakdown" && <FareBreakdownPanel />}
            </div>
          </div>

          {/* Right — Booking sidebar */}
          <aside className="w-[320px] shrink-0">
            <div className="sticky top-6 rounded-xl border border-white/10 bg-[#1e1e1c] p-5">
              <h3 className="text-foreground text-base font-medium">
                Book this train
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {dateLabel && (
                  <span className="text-foreground/70 inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {dateLabel}
                  </span>
                )}
                <span className="text-foreground/70 inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs">
                  {quotaLabels[quota] ?? quota} quota
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {classes.length === 0 && (
                  <p className="text-foreground/40 text-sm">
                    No classes available
                  </p>
                )}
                {classes.map((c) => {
                  const avail = seatClassMap[c.class_code];
                  return (
                    <div
                      key={c.class_code}
                      className={`rounded-lg border p-3 ${
                        c.class_code === cls
                          ? "border-accent-warm/30 bg-accent-warm/5"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-foreground text-sm font-semibold">
                            {c.class_code}{" "}
                            <span className="text-foreground/50 ml-1 text-xs font-normal">
                              {classLabels[c.class_code] ?? ""}
                            </span>
                          </p>
                          {canFetchSeats ? (
                            seatsLoading ? (
                              <p className="text-foreground/40 mt-1 inline-flex items-center gap-1.5 text-xs">
                                <Spinner className="size-3" />
                                Checking…
                              </p>
                            ) : avail ? (
                              <p
                                className={`mt-1 text-xs font-medium ${
                                  avail.status === "AVL"
                                    ? "text-emerald-400"
                                    : avail.status === "WL"
                                      ? "text-amber-400"
                                      : avail.status === "RAC"
                                        ? "text-orange-400"
                                        : "text-foreground/40"
                                }`}
                              >
                                {avail.status} {avail.count}
                              </p>
                            ) : (
                              <p className="text-foreground/40 mt-1 text-xs">
                                Not available
                              </p>
                            )
                          ) : (
                            <p className="text-foreground/40 mt-1 text-xs">
                              {c.total_seats} seats
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleBook(c.class_code)}
                          className="bg-accent-warm shrink-0 cursor-pointer rounded-lg px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          {isAuthed ? (
                            "Book"
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <Lock className="h-3 w-3" />
                              Book
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isAuthed && (
                <p className="text-foreground/40 mt-4 text-xs">
                  Login required to see live availability and book.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// ── Schedule Table ──
function ScheduleTable({
  stops,
  dayMap,
}: {
  stops: TrainScheduleStop[];
  dayMap: number[];
}) {
  if (stops.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1e1e1c] p-12 text-center">
        <p className="text-foreground/50">No schedule available</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1c]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 bg-white/[0.02] hover:bg-white/[0.02]">
            <TableHead className="text-foreground/40 w-14 px-6 py-3 text-xs font-medium tracking-wider uppercase">
              #
            </TableHead>
            <TableHead className="text-foreground/40 px-2 py-3 text-xs font-medium tracking-wider uppercase">
              Station
            </TableHead>
            <TableHead className="text-foreground/40 w-28 px-2 py-3 text-xs font-medium tracking-wider uppercase">
              Arrival
            </TableHead>
            <TableHead className="text-foreground/40 w-28 px-2 py-3 text-xs font-medium tracking-wider uppercase">
              Departure
            </TableHead>
            <TableHead className="text-foreground/40 w-24 px-2 py-3 text-xs font-medium tracking-wider uppercase">
              Halt
            </TableHead>
            <TableHead className="text-foreground/40 w-28 px-2 py-3 text-xs font-medium tracking-wider uppercase">
              Distance
            </TableHead>
            <TableHead className="text-foreground/40 w-16 px-2 py-3 text-xs font-medium tracking-wider uppercase">
              Day
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stops.map((stop, idx) => {
            const highlight = stop.is_source || stop.is_destination;
            return (
              <TableRow
                key={stop.seq}
                className={`border-white/5 ${
                  highlight
                    ? "bg-accent-warm/5 hover:bg-accent-warm/10"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                <TableCell
                  className={`px-6 py-4 text-sm ${
                    highlight ? "text-accent-warm" : "text-foreground/40"
                  }`}
                >
                  {stop.seq}
                </TableCell>
                <TableCell className="px-2 py-4">
                  <p
                    className={`text-sm font-medium ${
                      highlight ? "text-accent-warm" : "text-foreground"
                    }`}
                  >
                    {stop.station_code} ·{" "}
                    <span className="font-normal">{stop.station_name}</span>
                  </p>
                </TableCell>
                <TableCell className="text-foreground/70 px-2 py-4 text-sm">
                  {stop.is_source ? "—" : formatTime(stop.arrival)}
                </TableCell>
                <TableCell className="text-foreground/70 px-2 py-4 text-sm">
                  {stop.is_destination ? "—" : formatTime(stop.departure)}
                </TableCell>
                <TableCell className="text-foreground/60 px-2 py-4 text-sm">
                  {stop.halt_minutes > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-50" />
                      {stop.halt_minutes}m
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-foreground/70 px-2 py-4 text-sm">
                  {stop.distance_km.toLocaleString()} km
                </TableCell>
                <TableCell className="text-foreground/50 px-2 py-4 text-sm">
                  {dayMap[idx] ?? 1}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Seat Availability Tab Content ──
function SeatAvailabilityPanel({
  classes,
  seatClassMap,
  isLoading,
  canFetch,
  isAuthed,
}: {
  classes: { class_code: string; total_seats: number }[];
  seatClassMap: Record<string, { status: string; count: number }>;
  isLoading: boolean;
  canFetch: boolean;
  isAuthed: boolean;
}) {
  if (!isAuthed) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#1e1e1c] p-12 text-center">
        <Lock className="text-foreground/40 h-8 w-8" />
        <p className="text-foreground/60 text-sm">
          Login to see live seat availability
        </p>
      </div>
    );
  }

  if (!canFetch) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1e1e1c] p-12 text-center">
        <p className="text-foreground/50 text-sm">
          Pick journey date, from and to stations to check availability
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1e1e1c] p-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {classes.map((c) => {
          const avail = seatClassMap[c.class_code];
          return (
            <div
              key={c.class_code}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
            >
              <p className="text-foreground text-lg font-semibold">
                {c.class_code}
              </p>
              <p className="text-foreground/40 text-xs">
                {classLabels[c.class_code] ?? ""}
              </p>
              {isLoading ? (
                <div className="mt-3 h-6 w-16 animate-pulse rounded bg-white/5" />
              ) : avail ? (
                <p
                  className={`mt-3 text-base font-medium ${
                    avail.status === "AVL"
                      ? "text-emerald-400"
                      : avail.status === "WL"
                        ? "text-amber-400"
                        : avail.status === "RAC"
                          ? "text-orange-400"
                          : "text-foreground/40"
                  }`}
                >
                  {avail.status} {avail.count}
                </p>
              ) : (
                <p className="text-foreground/40 mt-3 text-sm">Not available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fare Breakdown Tab Content ──
function FareBreakdownPanel() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#1e1e1c] p-12 text-center">
      <Sparkles className="text-accent-warm/60 h-8 w-8" />
      <p className="text-foreground/60 text-sm">
        Fare breakdown will appear once the booking flow is connected.
      </p>
    </div>
  );
}
