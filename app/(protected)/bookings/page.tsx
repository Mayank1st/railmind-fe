"use client";

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
  Users,
} from "lucide-react";
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

import { useAuthStore } from "@/store/auth";
import { useJourneys } from "@/hooks/useJourneys";
import type { BookingStatus, Journey } from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "CNF",
  cancelled: "CAN",
  waitlisted: "WL",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-300 border border-red-500/20",
  waitlisted: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
};

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

  const nextJourney = upcoming.data?.journeys[0] ?? null;
  const recent = past.data?.journeys.slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-[1600px] px-12 py-10">
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

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionTile
          icon={<Search className="h-4 w-4" />}
          title="New booking"
          subtitle="Search trains"
          href="/"
        />
        <ActionTile
          icon={<FileText className="h-4 w-4" />}
          title="PNR Status"
          subtitle="Track confirmation"
          href="/pnr"
        />
        <ActionTile
          icon={<Users className="h-4 w-4" />}
          title="Saved Passengers"
          subtitle="Manage list"
          href="/passengers"
        />
        <ActionTile
          icon={<Settings className="h-4 w-4" />}
          title="Profile"
          subtitle="Personal & KYC"
          href="/profile"
        />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-heading text-foreground text-2xl">
            Recent bookings
          </h2>
          {past.data && past.data.count > recent.length && (
            <Link
              href="/bookings/all"
              className="text-sm text-[#d6a572] hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        {past.isLoading ? (
          <RecentSkeleton />
        ) : recent.length === 0 ? (
          <Card className="bg-card/40">
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              No past journeys yet.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {recent.map((j) => (
              <RecentRow key={j.booking_id} journey={j} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Greeting({ firstName }: { firstName: string }) {
  const today = format(new Date(), "EEEE, dd MMM");
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-sm">{today}</p>
        <h1 className="font-heading text-foreground mt-1 text-5xl font-normal tracking-[-0.5px]">
          Hello, {firstName}.
        </h1>
      </div>
      <Button
        asChild
        className="rounded-full bg-[#d6a572] px-5 py-5 text-sm font-medium text-[#3d2817] hover:bg-[#c89a64]"
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
  return (
    <Card className="border-0 bg-[#d6a572] text-[#3d2817] shadow-none">
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-[#3d2817]/70">
              NEXT JOURNEY · {relativeDay(journey.journey_date)}
            </p>
            <h2 className="font-heading mt-2 flex items-center gap-3 text-4xl text-[#3d2817]">
              {journey.source_station}
              <ArrowRight className="h-7 w-7" />
              {journey.destination_station}
            </h2>
            <p className="mt-2 text-sm text-[#3d2817]/75">
              {journey.train_number} {formatTrainName(journey.train_name)} · PNR{" "}
              {journey.pnr_number}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-[#3d2817]/10 px-4 py-2">
            <span
              className={`h-2 w-2 rounded-full ${
                allConfirmed ? "bg-emerald-700" : "bg-amber-700"
              }`}
            />
            <span className="text-xs font-medium text-[#3d2817]">
              {allConfirmed
                ? "All confirmed"
                : statusLabel(journey.booking_status)}
            </span>
          </div>
        </div>

        <div className="my-8 h-px bg-[#3d2817]/15" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-wider text-[#3d2817]/60 uppercase">
              Departure
            </p>
            <p className="font-heading mt-1 text-2xl text-[#3d2817]">
              {formatDate(journey.journey_date)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-wider text-[#3d2817]/60 uppercase">
              From
            </p>
            <p className="font-heading mt-1 text-2xl text-[#3d2817]">
              {journey.source_station}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
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
      className="group bg-card/40 hover:bg-card/60 rounded-xl border border-white/8 p-5 transition-colors hover:border-white/15"
    >
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d2817] text-[#d6a572]">
        {icon}
      </div>
      <p className="text-foreground text-base font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
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
            className={`h-6 border-0 ${STATUS_CLASS[journey.booking_status]}`}
          >
            {STATUS_LABEL[journey.booking_status]}
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

function formatDate(iso: string): string {
  const d = parseJourneyDate(iso);
  if (!d) return iso;
  return format(d, "dd MMM yyyy");
}

function formatTrainName(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function statusLabel(s: BookingStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
