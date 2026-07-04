"use client";

import SearchForm from "@/components/train/SearchForm";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { LiveRunningDialog } from "@/components/live/live-running-dialog";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  Receipt,
  Bookmark,
  ArrowRight,
  TrainFront,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEMAND_STYLE,
  formatAvgDuration,
  formatMinFare,
  type WeeklyTrendingRoute,
} from "@/lib/trending";
import { useWeeklyTrendingRoutes } from "@/hooks/useWeeklyTrendingRoutes";
import { PopularDestinations } from "@/components/home/PopularDestinations";

type QuickLink = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
  dialog?: boolean;
};

const quickLinks: QuickLink[] = [
  {
    icon: ClipboardList,
    title: "PNR Status",
    subtitle: "Track confirmation",
    href: "/pnr",
  },
  {
    icon: Clock,
    title: "Live Running",
    subtitle: "Where is my train",
    href: "/live/12951",
    dialog: true,
  },
  {
    icon: Receipt,
    title: "Fare Enquiry",
    subtitle: "Class-wise breakup",
    href: "/fare",
  },
  {
    icon: Bookmark,
    title: "My Bookings",
    subtitle: "Manage trips",
    href: "/bookings",
  },
];

export default function HomePage() {
  const { data, isLoading } = useWeeklyTrendingRoutes();
  const routes = data?.routes ?? [];
  // Loading → show skeletons; loaded-but-empty (or errored → empty) hides the
  // whole section, per the trending contract's empty-week behavior.
  const showTrending = isLoading || routes.length > 0;

  // Grid adapts to the card count so a 2-route week doesn't leave an empty
  // third column (skeletons render as a full row of 3).
  const cardCount = isLoading ? 3 : routes.length;
  const gridColsClass =
    cardCount >= 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : cardCount === 2
        ? "sm:grid-cols-2"
        : "sm:max-w-md";

  return (
    <main className="relative min-h-screen bg-[#1a1a18]">
      {/* Background gradient — cream wash fading to dark */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#281506_0%,#1a1a18_45%)]" />

      {/* Content — gradient ke upar */}
      <div className="app-container relative z-10 pt-16 pb-16">
        {/* Badge */}
        <div className="flex">
          <span className="border-accent-warm/30 text-accent-warm flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
            <span className="bg-accent-warm h-2 w-2 rounded-full" />
            AI-powered confirmation predictions
          </span>
        </div>

        {/* Heading */}
        <div className="pt-8">
          <h1 className="text-foreground text-4xl leading-[1.1] font-normal tracking-[-0.5px] sm:text-5xl lg:text-[64px] lg:leading-[1.05] lg:tracking-[-1.28px]">
            Book your train, with a <br className="hidden sm:block" />
            little less{" "}
            <span className="text-accent-warm italic">uncertainty.</span>
          </h1>

          {/* Subtext */}
          <p className="text-subtext mt-6 max-w-lg text-[15px] sm:text-[17px]">
            Search 13,000+ trains across India. We&apos;ll predict your waitlist
            confirmation chance before you book.
          </p>
        </div>

        {/* Search Form*/}
        <SearchForm />

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const tileClass =
              "flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#121713] px-4 py-4 text-left hover:border-white/20 sm:gap-4 sm:px-5";
            const inner = (
              <>
                <div className="bg-accent-warm/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <link.icon className="text-accent-warm h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">
                    {link.title}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {link.subtitle}
                  </p>
                </div>
              </>
            );

            // Live Running asks for train number + date in a modal first.
            if (link.dialog) {
              return (
                <LiveRunningDialog key={link.title}>
                  <button type="button" className={tileClass}>
                    {inner}
                  </button>
                </LiveRunningDialog>
              );
            }

            return (
              <Link key={link.title} href={link.href} className={tileClass}>
                {inner}
              </Link>
            );
          })}
        </div>

        {/* Popular destinations — auto-scrolling carousel (mock data for now) */}
        <PopularDestinations />

        {/* Trending this week — backend computes this weekly (Sunday 23:59
            IST). Hidden entirely when there's no data for the week. */}
        {showTrending && (
          <section className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-foreground text-3xl font-normal">
                Trending this week
              </h2>
              <Link
                href="/trains/search"
                className="text-accent-warm text-sm hover:underline"
              >
                View all routes →
              </Link>
            </div>

            <div className={cn("mt-6 grid grid-cols-1 gap-4", gridColsClass)}>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TrendingCardSkeleton key={i} />
                  ))
                : routes.map((route) => (
                    <TrendingRouteCard
                      key={`${route.demand_level}-${route.source_station_code}-${route.destination_station_code}`}
                      route={route}
                    />
                  ))}
            </div>
          </section>
        )}

        {/* Waitlist CTA + Help */}
        <section className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="bg-accent-warm rounded-2xl p-8 lg:col-span-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#3d2817]/10 px-3 py-1 text-xs font-medium text-[#3d2817]">
              RailMind AI
            </span>
            <h2 className="font-heading mt-5 text-4xl font-normal text-[#3d2817]">
              Will my waitlist confirm?
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#3d2817]/80">
              We analyze 5 years of train-class-quota patterns to give you a
              real confirmation probability — before you pay.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121713] p-8">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-foreground text-xl font-semibold">
                Need help?
              </h3>
              <ComingSoonBadge />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              24/7 support for cancellations, refunds, or boarding queries.
            </p>
            <button
              disabled
              className="mt-5 cursor-not-allowed rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#1a1a18] opacity-50"
            >
              Open chat
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// "NEW DELHI" → "New Delhi" — station names come back upper-cased.
function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// One trending route card. train/duration/fare lines are best-effort — each is
// hidden when its field is null; the route + demand badge always render.
function TrendingRouteCard({ route }: { route: WeeklyTrendingRoute }) {
  const duration = formatAvgDuration(route.avg_duration_minutes);
  const fare = formatMinFare(route.min_fare);
  const demand = DEMAND_STYLE[route.demand_level];
  const href = `/trains/search?from=${route.source_station_code}&to=${route.destination_station_code}`;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-white/10 bg-[#121713] p-5 transition-colors hover:border-white/20"
    >
      {/* Route + demand badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium tracking-wider text-white/60 uppercase">
            {route.source_station_code}
            <ArrowRight className="h-3.5 w-3.5" />
            {route.destination_station_code}
          </p>
          <p className="mt-1 truncate text-xs text-white/35">
            {toTitleCase(route.source_station_name)} →{" "}
            {toTitleCase(route.destination_station_name)}
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs whitespace-nowrap",
            demand.badgeClassName
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", demand.dotClassName)}
          />
          {demand.label}
        </span>
      </div>

      {/* Representative train + avg journey */}
      {(route.train_number || duration) && (
        <div className="mt-5 flex items-center gap-3">
          <span className="bg-accent-warm/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <TrainFront className="text-accent-warm h-5 w-5" />
          </span>
          <div className="min-w-0">
            {route.train_number && (
              <p className="text-foreground truncate font-medium">
                {route.train_number}
                {route.train_name ? ` · ${route.train_name}` : ""}
              </p>
            )}
            {duration && (
              <p className="truncate text-xs text-white/40">{duration}</p>
            )}
          </div>
        </div>
      )}

      {/* Price + CTA */}
      <div className="mt-5 flex items-end justify-between border-t border-white/5 pt-4">
        <div className="flex items-baseline gap-1.5">
          {fare ? (
            <>
              <span className="text-sm text-white/40">from</span>
              <span className="text-foreground text-2xl font-semibold">
                {fare}
              </span>
            </>
          ) : (
            <span className="text-sm text-white/40">View fares</span>
          )}
        </div>
        <span className="text-accent-warm flex items-center gap-1 text-sm font-medium">
          Search
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function TrendingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121713] p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-white/10" />
        <div>
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-20 animate-pulse rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        <div className="h-7 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}
