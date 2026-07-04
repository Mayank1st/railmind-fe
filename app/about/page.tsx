import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  ImageIcon,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About — RailMind",
  description:
    "RailMind is an AI-powered railway reservation platform taking the guesswork out of train travel.",
};

const stats = [
  { value: "13,400+", label: "Trains covered" },
  { value: "4.2M", label: "Tickets booked" },
  { value: "87%", label: "Avg WL prediction accuracy" },
  { value: "4.8★", label: "App store rating" },
];

const values: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Sparkles,
    title: "AI that earns trust",
    body: "Every prediction is backed by five years of real booking data — shown as a clear probability, never a false promise.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by default",
    body: "IDs are encrypted at rest and always masked. We share data with the railway system only at the moment of booking.",
  },
  {
    icon: ReceiptText,
    title: "No hidden charges",
    body: "The fare you see is the fare you pay. Every rupee is itemised before you confirm.",
  },
  {
    icon: Clock,
    title: "Built for the rush",
    body: "Atomic booking and escrow payments mean a failed Tatkal attempt is auto-refunded — no manual claims.",
  },
];

const timeline = [
  {
    year: "2023",
    title: "The idea",
    body: "Two frequent travellers, tired of waitlist guesswork, started modelling confirmation odds from public railway data.",
  },
  {
    year: "2024",
    title: "First prediction engine",
    body: "Our confirmation-probability model crossed 85% accuracy and RailMind opened in private beta.",
  },
  {
    year: "2025",
    title: "Public launch",
    body: "RailMind went live nationwide with AI predictions, smart search and instant refunds.",
  },
  {
    year: "2026",
    title: "Phase 2",
    body: "KYC-based Tatkal auto-booking, live running with movement prediction, and multi-lingual support roll out.",
  },
];

// Gallery bento tiles. To go live, just fill in each tile's `src` with its
// Supabase Storage public URL (bucket `railmind`, folder `about/gallery/`):
//   https://<project>.supabase.co/storage/v1/object/public/railmind/about/gallery/<file>
// While `src` is empty a dashed placeholder shows in the same grid slot.
type GalleryTile = {
  label: string;
  alt: string;
  className: string; // grid placement + min-height
  src?: string;
};

const gallery: GalleryTile[] = [
  {
    label: "Drop station photo",
    alt: "A busy railway platform at a RailMind-covered station",
    className: "min-h-[220px] sm:col-span-1 sm:row-span-2 sm:min-h-0",
    src: "", // e.g. ".../about/gallery/station.jpg"
  },
  {
    label: "Drop photo",
    alt: "A traveller boarding a train booked on RailMind",
    className: "min-h-[220px] sm:col-start-2 sm:row-start-1",
    src: "", // e.g. ".../about/gallery/moment-1.jpg"
  },
  {
    label: "Drop photo",
    alt: "Scenic view from a train window on an Indian rail journey",
    className: "min-h-[220px] sm:col-start-3 sm:row-start-1",
    src: "", // e.g. ".../about/gallery/moment-2.jpg"
  },
  {
    label: "Drop photo",
    alt: "Passengers settled in for a comfortable train journey",
    className: "min-h-[220px] sm:col-span-2 sm:col-start-2 sm:row-start-2",
    src: "", // e.g. ".../about/gallery/moment-3.jpg"
  },
];

function GalleryTileView({ tile }: { tile: GalleryTile }) {
  if (tile.src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/8",
          tile.className
        )}
      >
        <Image
          src={tile.src}
          alt={tile.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center",
        tile.className
      )}
    >
      <ImageIcon className="h-6 w-6 text-white/20" />
      <p className="text-sm text-white/30">
        {tile.label}
        <br />
        <span className="text-white/20">or browse files</span>
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[#1a1a18]">
      {/* Warm wash fading to dark — same hero gradient as home / help */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#281506_0%,#1a1a18_45%)]" />

      <div className="app-container relative z-10 pt-14 pb-24 md:pb-20">
        {/* ── Hero ── */}
        <section>
          <span className="border-accent-warm/30 text-accent-warm inline-flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
            <span className="bg-accent-warm h-2 w-2 rounded-full" />
            Our story
          </span>

          <h1 className="text-foreground mt-8 max-w-4xl text-4xl leading-[1.05] font-normal tracking-[-1px] sm:text-5xl lg:text-[64px]">
            We&apos;re taking the{" "}
            <span className="text-accent-warm italic">guesswork</span> out of
            train travel.
          </h1>

          <p className="text-subtext mt-6 max-w-2xl text-base sm:text-lg">
            RailMind is an AI-powered railway reservation platform built for the
            25 million Indians who travel by train every day. We predict
            confirmations, surface the smartest routes, and make booking calm
            instead of chaotic.
          </p>
        </section>

        {/* ── Stats ── */}
        <section className="mt-12">
          <div className="grid grid-cols-2 divide-white/8 rounded-3xl border border-white/8 bg-[#1e1e1c]/60 sm:grid-cols-4 sm:divide-x">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "px-6 py-8 text-center",
                  // top border between rows on the 2-col mobile grid
                  i >= 2 && "border-t border-white/8 sm:border-t-0"
                )}
              >
                <p className="text-accent-warm font-heading text-4xl sm:text-5xl">
                  {s.value}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our mission ── */}
        <section className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-accent-warm text-sm font-semibold tracking-[1.5px] uppercase">
              Our mission
            </p>
            <h2 className="text-foreground mt-4 text-3xl leading-tight sm:text-4xl">
              Make every journey predictable, transparent, and fair.
            </h2>
            <div className="text-subtext mt-6 space-y-5 text-base leading-relaxed">
              <p>
                For decades, booking a train meant refreshing a page and hoping.
                Waitlists were a black box. We built RailMind to replace that
                anxiety with clarity — a confirmation probability before you
                pay, and a refund the instant something fails.
              </p>
              <p>
                We&apos;re not a booking agent bolted onto old rails. We&apos;re
                an AI company that happens to sell tickets.
              </p>
            </div>
          </div>

          <div className="bg-accent-warm rounded-3xl p-8 text-[#3d2817] sm:p-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3d2817]/15">
              <Sparkles className="h-5 w-5 text-[#3d2817]" />
            </span>
            <h3 className="font-heading mt-6 text-2xl sm:text-3xl">
              How the prediction works
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[#3d2817]/85">
              We analyse five years of train–class–quota patterns for your exact
              route and date, then weigh them against live availability. The
              result is a single honest number: your chance of confirmation. It
              updates as seats move — guidance you can plan around, never a
              false guarantee.
            </p>
          </div>
        </section>

        {/* ── Life on the rails (gallery) ── */}
        <section className="mt-20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-foreground text-3xl sm:text-4xl">
              Life on the rails
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Moments from journeys booked on RailMind
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-2">
            {gallery.map((tile, i) => (
              <GalleryTileView key={i} tile={tile} />
            ))}
          </div>
        </section>

        {/* ── What we stand for ── */}
        <section className="mt-20">
          <h2 className="text-foreground text-3xl sm:text-4xl">
            What we stand for
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="flex gap-4 rounded-2xl border border-white/8 bg-[#1e1e1c]/60 p-6"
                >
                  <span className="text-accent-warm flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3d2817]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-foreground font-heading text-lg">
                      {v.title}
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {v.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── The journey so far (timeline) ── */}
        <section className="mt-20">
          <h2 className="text-foreground text-3xl sm:text-4xl">
            The journey so far
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((t) => (
              <div
                key={t.year}
                className="border-t-accent-warm rounded-2xl border border-t-2 border-white/8 bg-[#1e1e1c]/60 p-6"
              >
                <p className="text-accent-warm text-sm font-semibold">
                  {t.year}
                </p>
                <h3 className="text-foreground mt-2 font-medium">{t.title}</h3>
                <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-accent-warm/30 mt-20 overflow-hidden rounded-3xl border bg-[linear-gradient(180deg,#2a1808_0%,#211405_100%)] px-6 py-16 text-center sm:px-12">
          <h2 className="text-foreground text-3xl sm:text-4xl">
            Ready to travel smarter?
          </h2>
          <p className="text-subtext mt-3 text-base sm:text-lg">
            Join millions who book with confidence on RailMind.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="bg-accent-warm hover:bg-accent-warm/90 rounded-xl px-6 py-6 font-medium text-[#3d2817]"
            >
              <Link href="/">
                <Search className="h-4 w-4" />
                Search trains
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="text-foreground rounded-xl border border-white/10 bg-[#1e1e1c] px-6 py-6 font-medium hover:bg-[#26261f]"
            >
              <Link href="/help">
                Contact us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
