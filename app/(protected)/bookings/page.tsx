"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Download,
  FileText,
  Radio,
  Search,
  Settings,
  Sparkles,
  TrainFront,
  Users,
} from "lucide-react";
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

import { useAuthStore } from "@/store/auth";
import { useJourneys } from "@/hooks/useJourneys";
import { usePassengers } from "@/hooks/usePassengers";
import {
  bookingStatusMeta,
  type Journey,
  type JourneyAction,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function parseJourneyDate(iso: string): Date | null {
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

function relativeDay(iso: string): string {
  const d = parseJourneyDate(iso);
  if (!d) return "";
  const diff = differenceInCalendarDays(d, new Date());
  if (diff === 0) return "TODAY";
  if (diff === 1) return "TOMORROW";
  if (diff > 1) return `IN ${diff} DAYS`;
  if (diff === -1) return "YESTERDAY";
  return `${Math.abs(diff)} DAYS AGO`;
}

export default function BookingsPage() {
  const router = useRouter();
  const firstName = useAuthStore((s) => s.user?.first_name) ?? "there";

  const upcoming = useJourneys("UPCOMING");
  const past = useJourneys("PAST");
  const passengers = usePassengers();
  const savedCount = passengers.data?.length ?? 0;

  // "My bookings" tab — each tab is its own API action (UPCOMING / PAST) and we
  // surface only the top 3; the full, paginated list lives behind "View all".
  const [tab, setTab] = useState<JourneyAction>("UPCOMING");
  const activeList = tab === "UPCOMING" ? upcoming : past;
  const topThree = activeList.data?.journeys.slice(0, 3) ?? [];

  const nextJourney = upcoming.data?.journeys[0] ?? null;
  const anyBookings = (upcoming.data?.count ?? 0) + (past.data?.count ?? 0) > 0;
  const allJourneys = [
    ...(upcoming.data?.journeys ?? []),
    ...(past.data?.journeys ?? []),
  ];

  return (
    <div className="app-container py-10">
      <Greeting firstName={firstName} />

      <section className="mt-8">
        {upcoming.isLoading ? (
          <HeroSkeleton />
        ) : nextJourney ? (
          <HeroCard
            journey={nextJourney}
            onView={(id) => router.push(`/bookings/${id}`)}
          />
        ) : (
          <HeroEmpty />
        )}
      </section>

      <section className="mt-6 grid grid-cols-4 gap-2.5 sm:gap-4">
        <ActionTile
          icon={<Search className="h-4 w-4" />}
          title="Search"
          subtitle="Search trains"
          href="/"
        />
        <ActionTile
          icon={<FileText className="h-4 w-4" />}
          title="PNR"
          subtitle="Track confirmation"
          href="/pnr"
        />
        <ActionTile
          icon={<Users className="h-4 w-4" />}
          title="Passengers"
          subtitle={savedCount > 0 ? `${savedCount} saved` : "Manage list"}
          href="/passengers"
        />
        <ActionTile
          icon={<Settings className="h-4 w-4" />}
          title="Profile"
          subtitle="Personal & KYC"
          href="/profile"
        />
      </section>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h2 className="font-heading text-foreground text-2xl">
                My bookings
              </h2>
              <ToggleGroup
                type="single"
                value={tab}
                onValueChange={(v) => v && setTab(v as JourneyAction)}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"
              >
                {(["UPCOMING", "PAST"] as const).map((t) => (
                  <ToggleGroupItem
                    key={t}
                    value={t}
                    className="text-muted-foreground hover:text-foreground h-auto flex-none cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium first:rounded-full last:rounded-full hover:bg-transparent data-[state=on]:bg-[#E8AA4D] data-[state=on]:text-[#3d2817]"
                  >
                    {t === "UPCOMING" ? "Upcoming" : "Past"}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            {anyBookings && (
              <Link
                href="/bookings/all"
                className="shrink-0 text-sm text-[#E8AA4D] hover:underline"
              >
                View all →
              </Link>
            )}
          </div>

          {activeList.isLoading ? (
            <RecentSkeleton />
          ) : topThree.length === 0 ? (
            <Card className="bg-card/40">
              <CardContent className="text-muted-foreground py-8 text-center text-sm">
                {tab === "UPCOMING"
                  ? "No upcoming journeys."
                  : "No past journeys yet."}
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {topThree.map((j) => (
                <RecentRow key={j.booking_id} journey={j} />
              ))}
            </ul>
          )}
        </section>

        <ForYou
          journeys={allJourneys}
          isLoading={upcoming.isLoading || past.isLoading}
        />
      </div>
    </div>
  );
}

function Greeting({ firstName }: { firstName: string }) {
  const today = format(new Date(), "EEEE, dd MMM");
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm">{today}</p>
        <h1 className="font-heading text-foreground mt-1 text-[34px] leading-[1.1] font-normal tracking-[-0.5px] break-words sm:text-5xl sm:leading-tight">
          Hello, {firstName}.
        </h1>
      </div>
      <Button
        asChild
        className="w-full rounded-full bg-[#E8AA4D] px-5 py-5 text-sm font-medium text-[#3d2817] hover:bg-[#D09840] sm:w-auto sm:shrink-0"
      >
        <Link href="/">
          <Search className="h-4 w-4" />
          New booking
        </Link>
      </Button>
    </div>
  );
}

function HeroCard({
  journey,
  onView,
}: {
  journey: Journey;
  onView: (bookingId: string) => void;
}) {
  const allConfirmed = journey.booking_status === "confirmed";
  const statusText = allConfirmed
    ? "All confirmed"
    : bookingStatusMeta(journey.booking_status).label;
  return (
    <Card className="border-0 bg-[#E8AA4D] text-[#3d2817] shadow-none">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#3d2817]/70">
              NEXT JOURNEY · {relativeDay(journey.journey_date)}
            </p>

            {/* Mobile status pill — the desktop circle (right) would overlap the
                route heading on narrow screens, so swap to an inline pill. */}
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3d2817]/10 px-3 py-1 text-xs font-medium text-[#3d2817] sm:hidden">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  allConfirmed ? "bg-emerald-700" : "bg-amber-700"
                }`}
              />
              {statusText}
            </span>

            <h2 className="font-heading mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl text-[#3d2817] sm:text-4xl">
              {journey.source_station}
              <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7" />
              {journey.destination_station}
            </h2>
            <p className="mt-2 text-sm text-[#3d2817]/75">
              {journey.train_number} {formatTrainName(journey.train_name)} · PNR{" "}
              {journey.pnr_number}
            </p>
          </div>

          {/* Desktop status circle */}
          <div className="hidden h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full bg-[#3d2817]/10 text-center sm:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                allConfirmed ? "bg-emerald-700" : "bg-amber-700"
              }`}
            />
            <span className="px-2 text-xs leading-tight font-medium text-[#3d2817]">
              {statusText}
            </span>
          </div>
        </div>

        <div className="my-6 h-px bg-[#3d2817]/15 sm:my-8" />

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="shrink-0">
            <p className="font-heading text-xl text-[#3d2817] sm:text-2xl">
              {journey.source_station}
            </p>
            <p className="mt-1 text-xs tracking-wider text-[#3d2817]/60 uppercase">
              Departure
            </p>
          </div>

          <div className="flex flex-1 items-center">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#3d2817]" />
            <span className="h-px flex-1 bg-[#3d2817]/25" />
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#3d2817]/10 px-2.5 py-1 text-[11px] font-medium text-[#3d2817] sm:px-3 sm:text-xs">
              <TrainFront className="h-3.5 w-3.5" />
              {formatDateShort(journey.journey_date)}
            </span>
            <span className="h-px flex-1 bg-[#3d2817]/25" />
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#3d2817]" />
          </div>

          <div className="shrink-0 text-right">
            <p className="font-heading text-xl text-[#3d2817] sm:text-2xl">
              {journey.destination_station}
            </p>
            <p className="mt-1 text-xs tracking-wider text-[#3d2817]/60 uppercase">
              Arrival
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
          <Button
            variant="secondary"
            className="rounded-full bg-white px-5 text-[#3d2817] hover:bg-white/90"
          >
            <Download className="h-4 w-4" />
            E-Ticket
          </Button>
          <Button
            variant="ghost"
            className="rounded-full bg-[#3d2817]/10 px-5 text-[#3d2817] hover:bg-[#3d2817]/15"
          >
            <Radio className="h-4 w-4" />
            Live status
          </Button>
          <Button
            variant="ghost"
            onClick={() => onView(journey.booking_id)}
            className="rounded-full bg-[#3d2817]/10 px-5 text-[#3d2817] hover:bg-[#3d2817]/15"
          >
            View details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroEmpty() {
  return (
    <Card className="bg-card/40 border-dashed border-white/10">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No upcoming journey yet.
        </p>
        <Button asChild className="rounded-full">
          <Link href="/">
            <Search className="h-4 w-4" />
            Book a train
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function HeroSkeleton() {
  return <div className="bg-card/40 h-72 w-full animate-pulse rounded-xl" />;
}

function ActionTile({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card/40 hover:bg-card/60 flex flex-col items-center gap-2 rounded-xl border border-white/8 p-2.5 text-center transition-colors hover:border-white/15 sm:items-start sm:gap-0 sm:p-5 sm:text-left"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d2817] text-[#E8AA4D] sm:mb-4">
        {icon}
      </div>
      <p className="text-foreground text-[11px] leading-tight font-medium sm:text-base">
        {title}
      </p>
      <p className="text-muted-foreground hidden text-xs sm:mt-1 sm:block">
        {subtitle}
      </p>
    </Link>
  );
}

function RecentRow({ journey }: { journey: Journey }) {
  return (
    <li>
      <Link
        href={`/bookings/${journey.booking_id}`}
        className="bg-card/40 hover:bg-card/60 flex items-center justify-between rounded-xl border border-white/8 px-5 py-4 transition-colors hover:border-white/15"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="text-muted-foreground font-mono text-xs">
            {journey.pnr_number}
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-medium">
              {journey.train_number} {formatTrainName(journey.train_name)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {formatDate(journey.journey_date)} · {journey.source_station} →{" "}
              {journey.destination_station}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`h-6 ${bookingStatusMeta(journey.booking_status).className}`}
          >
            {bookingStatusMeta(journey.booking_status).short}
          </Badge>
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        </div>
      </Link>
    </li>
  );
}

function RecentSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="bg-card/40 h-14 animate-pulse rounded-xl" />
      ))}
    </ul>
  );
}

// The most-travelled source→destination pair across the user's journeys.
// Stands in for a recommendations API until one exists — swap the body for a
// fetch and the rest of <ForYou /> stays the same.
function usualRoute(journeys: Journey[]): { from: string; to: string } | null {
  let best: { from: string; to: string; n: number } | null = null;
  const counts = new Map<string, { from: string; to: string; n: number }>();
  for (const j of journeys) {
    const key = `${j.source_station}-${j.destination_station}`;
    const entry = counts.get(key) ?? {
      from: j.source_station,
      to: j.destination_station,
      n: 0,
    };
    entry.n += 1;
    counts.set(key, entry);
    if (!best || entry.n > best.n) best = entry;
  }
  return best ? { from: best.from, to: best.to } : null;
}

function ForYou({
  journeys,
  isLoading,
}: {
  journeys: Journey[];
  isLoading: boolean;
}) {
  const route = usualRoute(journeys);
  return (
    <section>
      <h2 className="font-heading text-foreground mb-4 text-2xl">For you</h2>
      {isLoading ? (
        <div className="bg-card/40 h-44 animate-pulse rounded-xl" />
      ) : (
        <Card className="bg-card/40 border-white/8 shadow-none">
          <CardContent className="p-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#E8AA4D]">
              <Sparkles className="h-3.5 w-3.5" />
              Smart suggestion
            </span>
            {route ? (
              <>
                <p className="text-foreground mt-4 text-base leading-snug font-medium">
                  Tatkal opens one day before travel
                </p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  For your usual {route.from} → {route.to} route — 10 AM for AC,
                  11 AM for Sleeper.
                </p>
              </>
            ) : (
              <>
                <p className="text-foreground mt-4 text-base leading-snug font-medium">
                  Tips tailored to your trips
                </p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  Book a journey and we&apos;ll surface Tatkal windows and fare
                  alerts for your routes here.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  const d = parseJourneyDate(iso);
  if (!d) return iso;
  return format(d, "dd MMM yyyy");
}

function formatDateShort(iso: string): string {
  const d = parseJourneyDate(iso);
  if (!d) return iso;
  return format(d, "EEE, dd MMM");
}

function formatTrainName(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
