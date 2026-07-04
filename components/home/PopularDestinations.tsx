"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMinFare, type PopularDestination } from "@/lib/trending";
import { usePopularDestinations } from "@/hooks/usePopularDestinations";

const AUTO_ADVANCE_MS = 3500;
const SKELETON_COUNT = 4;

function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// "VARANASI JN" → "Varanasi", "NEW DELHI" → "New Delhi"
function prettyStationName(name: string): string {
  return toTitleCase(name.replace(/\s+jn\.?$/i, "").trim());
}

export function PopularDestinations() {
  const { data, isLoading } = usePopularDestinations();
  const destinations = data?.destinations ?? [];
  const weekStart = data?.week_start ?? null;

  const scrollerRef = useRef<HTMLDivElement>(null);
  // Refs mirror state for use inside interval/scroll callbacks (no stale closures).
  const stepRef = useRef(1);
  const pageCountRef = useRef(1);
  const pausedRef = useRef(false);
  const countRef = useRef(0);

  const [active, setActive] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  // Mirror the live count into a ref so the auto-advance interval (below) can
  // read it without re-subscribing.
  useEffect(() => {
    countRef.current = destinations.length;
  }, [destinations.length]);

  // Measure card step (width + gap) and how many scroll "pages" exist. Re-runs
  // when the rendered item set changes (skeletons → real cards).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const measure = () => {
      const kids = el.children;
      if (kids.length === 0) return;
      const first = kids[0] as HTMLElement;
      const step =
        kids.length > 1
          ? (kids[1] as HTMLElement).offsetLeft - first.offsetLeft
          : first.offsetWidth;
      stepRef.current = step || 1;
      const perView = Math.max(1, Math.round(el.clientWidth / stepRef.current));
      const pages = Math.max(1, kids.length - perView + 1);
      pageCountRef.current = pages;
      setPageCount(pages);
    };

    const onScroll = () => {
      const i = Math.round(el.scrollLeft / stepRef.current);
      setActive(Math.min(Math.max(i, 0), pageCountRef.current - 1));
    };

    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [isLoading, destinations.length]);

  // Auto-advance — only once real cards exist; pauses on hover, respects reduced-motion.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el || pausedRef.current || countRef.current === 0) return;
      const cur = Math.round(el.scrollLeft / stepRef.current);
      const next = cur + 1 >= pageCountRef.current ? 0 : cur + 1;
      el.scrollTo({ left: next * stepRef.current, behavior: "smooth" });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.min(Math.max(i, 0), pageCountRef.current - 1);
    el.scrollTo({ left: clamped * stepRef.current, behavior: "smooth" });
  };

  const go = (dir: 1 | -1) => {
    const last = pageCountRef.current - 1;
    let target = active + dir;
    if (target < 0) target = last;
    if (target > last) target = 0;
    scrollToIndex(target);
  };

  // Empty week (or error) → hide the whole section. Hooks already ran above.
  if (!isLoading && destinations.length === 0) return null;

  return (
    <section className="mt-14">
      {/* Header — badge + heading, prev/next controls */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="border-accent-warm/30 text-accent-warm inline-flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
            <span className="bg-accent-warm h-2 w-2 rounded-full" />
            Popular destinations
          </span>
          <h2 className="font-heading text-foreground mt-4 text-3xl font-normal sm:text-4xl">
            Where India&apos;s heading
          </h2>
        </div>
        {destinations.length > 0 && (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <CarouselButton
              label="Previous destinations"
              onClick={() => go(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </CarouselButton>
            <CarouselButton label="Next destinations" onClick={() => go(1)}>
              <ArrowRight className="h-4 w-4" />
            </CarouselButton>
          </div>
        )}
      </div>

      {/* Track */}
      <div
        ref={scrollerRef}
        onPointerEnter={() => (pausedRef.current = true)}
        onPointerLeave={() => (pausedRef.current = false)}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <DestinationCardSkeleton key={i} />
            ))
          : destinations.map((d) => (
              <DestinationCard
                key={d.destination_station_code}
                destination={d}
                weekStart={weekStart}
              />
            ))}
      </div>

      {/* Dots */}
      {destinations.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active
                  ? "bg-accent-warm w-6"
                  : "w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
    >
      {children}
    </button>
  );
}

function DestinationCard({
  destination: d,
  weekStart,
}: {
  destination: PopularDestination;
  weekStart: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const city = prettyStationName(d.destination_station_name);
  const origin = prettyStationName(d.origin_station_name);
  const fare = formatMinFare(d.min_fare);
  const href = `/trains/search?from=${d.origin_station_code}&to=${d.destination_station_code}`;
  // Images are immutable per city, but bust weekly in case one is regenerated
  // under the same name (per the API guide).
  const imageSrc =
    d.image_url && weekStart ? `${d.image_url}?v=${weekStart}` : d.image_url;
  const showImage = Boolean(imageSrc) && !imgFailed;

  return (
    <Link
      href={href}
      className="group w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#121713] transition-colors hover:border-white/20 sm:w-[46%] lg:w-[31.5%]"
    >
      {/* Photo / fallback */}
      <div className="relative h-52 bg-white/[0.02]">
        {showImage ? (
          <>
            <Image
              src={imageSrc as string}
              alt={city}
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 46vw, 32vw"
              className="object-cover object-center"
              onError={() => setImgFailed(true)}
            />
            {/* Scrim so the tagline stays readable over the photo */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
          </>
        ) : (
          // Fallback for a null/failed image_url — never a broken <img>.
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#2a1808] to-[#1a1a18]">
            <span className="font-heading text-4xl text-white/10">
              {d.destination_station_code}
            </span>
          </div>
        )}
        {d.tagline && (
          <span className="text-accent-warm absolute top-4 left-4 text-xs font-semibold tracking-wide drop-shadow">
            {d.tagline}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-heading text-foreground truncate text-2xl">
            {city}
          </h3>
          <span className="shrink-0 text-xs tracking-wider text-white/40">
            {d.destination_station_code}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-white/50">
          from {origin}
          {d.trains_count != null
            ? ` · ${d.trains_count} train${d.trains_count === 1 ? "" : "s"}`
            : ""}
        </p>

        <div className="mt-5 flex items-center justify-between gap-2">
          {fare ? (
            <span className="flex items-baseline gap-1.5">
              <span className="text-sm text-white/40">from</span>
              <span className="text-foreground text-xl font-semibold">
                {fare}
              </span>
            </span>
          ) : (
            <span />
          )}
          <span className="bg-accent-warm inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-[#3d2817]">
            Explore
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function DestinationCardSkeleton() {
  return (
    <div className="w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#121713] sm:w-[46%] lg:w-[31.5%]">
      <div className="h-52 animate-pulse bg-white/[0.04]" />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="h-6 w-28 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-10 animate-pulse rounded bg-white/10" />
        </div>
        <div className="mt-2 h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-5 flex items-center justify-between">
          <div className="h-6 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
}
