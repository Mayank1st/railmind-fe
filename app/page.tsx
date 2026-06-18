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
  type LucideIcon,
} from "lucide-react";

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

const trendingRoutes = [
  {
    from: "BCT",
    to: "NDLS",
    demand: "High",
    trainNumber: "12951",
    trainName: "Mumbai Rajdhani",
    duration: "15h 35m avg journey",
    price: "₹1,310",
    href: "/trains/search?from=BCT&to=NDLS&class=SL&quota=GN&hours=48",
  },
  {
    from: "SBC",
    to: "MAS",
    demand: "Medium",
    trainNumber: "12028",
    trainName: "Shatabdi Exp",
    duration: "5h 00m avg journey",
    price: "₹780",
    href: "/trains/search?from=SBC&to=MAS&class=CC&quota=GN&hours=48",
  },
  {
    from: "HWH",
    to: "PURI",
    demand: "Low",
    trainNumber: "12277",
    trainName: "Howrah Puri",
    duration: "7h 45m avg journey",
    price: "₹420",
    href: "/trains/search?from=HWH&to=PURI&class=SL&quota=GN&hours=48",
  },
];

export default function HomePage() {
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

        {/* Trending this week */}
        <section className="mt-16">
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

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {trendingRoutes.map((route) => (
              <Link
                key={`${route.from}-${route.to}`}
                href={route.href}
                className="rounded-2xl border border-white/10 bg-[#121713] p-5 transition-colors hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-medium tracking-wider text-white/50 uppercase">
                    {route.from}
                    <ArrowRight className="h-3.5 w-3.5" />
                    {route.to}
                  </p>
                  <span className="border-accent-warm/30 text-accent-warm flex items-center gap-1.5 rounded-full border bg-[#2a2318] px-3 py-1 text-xs whitespace-nowrap">
                    <span className="bg-accent-warm h-1.5 w-1.5 rounded-full" />
                    {route.demand} demand
                  </span>
                </div>
                <p className="text-foreground mt-4 text-lg font-medium">
                  {route.trainNumber} {route.trainName}
                </p>
                <p className="mt-1 text-sm text-white/40">{route.duration}</p>
                <div className="mt-5 flex items-end justify-between">
                  <span className="text-sm text-white/40">from</span>
                  <span className="text-foreground text-2xl font-semibold">
                    {route.price}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Waitlist CTA + Help */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
