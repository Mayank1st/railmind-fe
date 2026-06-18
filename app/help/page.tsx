"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { FAQ_TOPICS, FAQ_TOPIC_LABEL, type FaqCategory } from "@/lib/faq";
import { useAllFaqs } from "@/hooks/useFaqs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const POPULAR = ["cancel ticket", "refund status", "change date"];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory>("BOOKING");

  const { items, isLoading, isError } = useAllFaqs();
  const q = query.trim().toLowerCase();

  // Searching looks across every category; browsing shows the selected topic
  // (ordered by the backend's display_order).
  const results = useMemo(() => {
    if (q) {
      return items.filter((f) =>
        `${f.question} ${f.answer}`.toLowerCase().includes(q)
      );
    }
    return items
      .filter((f) => f.category === category)
      .sort((a, b) => a.display_order - b.display_order);
  }, [q, category, items]);

  const heading = q
    ? `${results.length} result${results.length === 1 ? "" : "s"} for “${query.trim()}”`
    : `${FAQ_TOPIC_LABEL[category]} · FAQ`;

  return (
    <main className="relative min-h-screen bg-[#1a1a18]">
      {/* Full-page warm wash fading to dark — same gradient as the home page */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#281506_0%,#1a1a18_45%)]" />

      {/* Narrower centered column than the wide app shell, per Figma.
          Extra bottom padding on mobile clears the fixed tab bar. */}
      <div className="app-container relative z-10 pb-24 md:pb-16">
        <div className="mx-auto max-w-6xl">
          {/* ── Hero ── */}
          <section>
            <div className="mx-auto max-w-2xl pt-10 pb-8 text-center sm:pt-16 sm:pb-10 lg:pt-20">
              <span className="border-accent-warm/30 text-accent-warm inline-flex items-center gap-2 rounded-full border bg-[#2a2318] px-4 py-1.5 text-sm">
                <span className="bg-accent-warm h-2 w-2 rounded-full" />
                Help Center
              </span>
              <h1 className="font-heading text-foreground mt-6 text-4xl font-normal tracking-[-1px] sm:text-5xl lg:text-6xl">
                How can we help?
              </h1>
              <p className="text-muted-foreground mt-4 text-base sm:text-lg">
                Search our guides or browse by topic. Most answers are instant.
              </p>

              <div className="relative mt-8">
                <Search className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search e.g. refund, waitlist, change date"
                  className="h-14 rounded-xl border-white/10 bg-[#2a2a28] pl-12 text-base dark:bg-[#2a2a28]"
                />
              </div>

              <p className="text-muted-foreground mt-4 text-sm">
                Popular:{" "}
                {POPULAR.map((p, i) => (
                  <span key={p}>
                    {i > 0 && <span className="mx-1 text-white/30">·</span>}
                    <button
                      type="button"
                      onClick={() => setQuery(p)}
                      className="text-accent-warm cursor-pointer hover:underline"
                    >
                      {p}
                    </button>
                  </span>
                ))}
              </p>
            </div>
          </section>

          {/* ── Browse by topic ── */}
          <section className="mt-6">
            <h2 className="font-heading text-foreground text-xl sm:text-2xl">
              Browse by topic
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
              {FAQ_TOPICS.map((t) => {
                const active = !q && t.key === category;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setCategory(t.key);
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-2.5 rounded-2xl border p-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-4 sm:p-5",
                      active
                        ? "border-[#E8AA4D]/60 bg-[#E8AA4D]/[0.07]"
                        : "bg-card/40 border-white/8 hover:border-white/15"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
                        active
                          ? "bg-[#E8AA4D] text-[#3d2817]"
                          : "bg-[#3d2817] text-[#E8AA4D]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-sm leading-tight font-medium sm:text-base",
                          active ? "text-[#E8AA4D]" : "text-foreground"
                        )}
                      >
                        {t.label}
                      </span>
                      <span className="text-muted-foreground mt-0.5 hidden text-sm sm:block">
                        {t.blurb}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── FAQ + sidebar ── */}
          <div className="mt-10 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-[1fr_360px]">
            <section>
              <h2 className="font-heading text-foreground text-2xl sm:text-3xl">
                {heading}
              </h2>

              {isLoading ? (
                <div className="mt-5 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-card/40 h-14 animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : isError ? (
                <Card className="mt-5 border-red-500/20 bg-red-500/[0.04] shadow-none">
                  <CardContent className="text-muted-foreground py-10 text-center text-sm">
                    Couldn&apos;t load FAQs right now. Please try again, or ask
                    the AI Assistant below.
                  </CardContent>
                </Card>
              ) : results.length === 0 ? (
                <Card className="bg-card/40 mt-5 border-white/8 shadow-none">
                  <CardContent className="text-muted-foreground py-10 text-center text-sm">
                    {q
                      ? `No answers matched “${query.trim()}”. Try the AI Assistant below.`
                      : "No FAQs in this topic yet."}
                  </CardContent>
                </Card>
              ) : (
                <Accordion
                  key={q || category}
                  type="single"
                  collapsible
                  defaultValue="item-0"
                  className="bg-card/40 mt-5 rounded-2xl border border-white/8 px-5"
                >
                  {results.map((f, i) => (
                    <AccordionItem
                      key={`${f.category}-${i}`}
                      value={`item-${i}`}
                      className="border-white/8"
                    >
                      <AccordionTrigger className="text-foreground py-5 text-base font-medium hover:no-underline">
                        {f.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pr-8 text-sm leading-relaxed">
                        {f.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {/* Can't find it banner */}
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#E8AA4D]/25 bg-[#241a0c] px-5 py-4 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#E8AA4D]" />
                <p className="text-white/80">
                  Can&apos;t find it? Ask the{" "}
                  <span className="font-semibold text-[#E8AA4D]">
                    RailMind AI Assistant
                  </span>{" "}
                  — it can pull up your bookings, explain a charge, or start a
                  cancellation for you.
                </p>
              </div>
            </section>

            {/* ── Sidebar ── */}
            <aside className="space-y-4">
              <Card className="border-0 bg-[#E8AA4D] text-[#3d2817] shadow-none">
                <CardContent className="p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3d2817]/15">
                    <Sparkles className="h-5 w-5 text-[#3d2817]" />
                  </span>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-xl">
                      Chat with AI Assistant
                    </h3>
                    <ComingSoonBadge className="border-[#3d2817]/20 bg-[#3d2817]/10 text-[#3d2817]" />
                  </div>
                  <p className="mt-1.5 text-sm text-[#3d2817]/80">
                    Instant answers, 24/7. Handles most queries without an
                    agent.
                  </p>
                  <Button
                    disabled
                    className="mt-5 w-full rounded-xl bg-white py-5 font-medium text-[#3d2817] hover:bg-white/90"
                  >
                    Open chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-white/8 shadow-none">
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-foreground font-medium">
                    Still need a human?
                  </h3>
                  <ContactRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email support"
                    value="help@railmind.app"
                    sub="Replies in ~4 hours"
                    href="mailto:help@railmind.app"
                  />
                  <ContactRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Call us"
                    value="1800-RAIL-MIND"
                    sub="Daily 6 AM – 11 PM"
                    href="tel:1800724546"
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-white/8 shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-foreground font-medium">
                      System status
                    </h3>
                    <ComingSoonBadge />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-foreground/90">
                      All systems operational
                    </span>
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function ContactRow({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  href: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-foreground text-sm font-medium">{label}</p>
        <a href={href} className="text-accent-warm text-sm hover:underline">
          {value}
        </a>
        <p className="text-muted-foreground text-xs">{sub}</p>
      </div>
    </div>
  );
}
