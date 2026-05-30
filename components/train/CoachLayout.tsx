"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Train as TrainIcon, Sparkles, Info } from "lucide-react";
import type { TrainCoach } from "@/lib/train";

const CLASS_LABELS: Record<string, string> = {
  SL: "Sleeper",
  "3A": "AC 3-Tier",
  "2A": "AC 2-Tier",
  "1A": "First AC",
  CC: "AC Chair Car",
  "2S": "Second Sitting",
  "3E": "AC 3 Economy",
  FC: "First Class",
};

const BAY_PATTERNS: Record<string, string[]> = {
  SL: ["LB", "UB", "MB", "LB", "UB", "MB", "SL", "SU"],
  "3A": ["LB", "UB", "MB", "LB", "UB", "MB", "SL", "SU"],
  "3E": ["LB", "UB", "MB", "LB", "UB", "MB", "SL", "SU"],
  "2A": ["LB", "UB", "LB", "UB", "SL", "SU"],
  "1A": ["LB", "UB"],
};

function bayPattern(trainClass: string): string[] {
  return BAY_PATTERNS[trainClass] ?? BAY_PATTERNS.SL;
}

type BerthState = "avl" | "booked" | "rac";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function berthState(coachNumber: string, berth: number): BerthState {
  const r = hashString(`${coachNumber}#${berth}`) % 100;
  if (r < 60) return "avl";
  if (r < 92) return "booked";
  return "rac";
}

type CoachStats = { avl: number; rac: number; booked: number };

function coachStats(coach: TrainCoach): CoachStats {
  let avl = 0;
  let rac = 0;
  let booked = 0;
  for (let b = 1; b <= coach.total_seats; b++) {
    const s = berthState(coach.coach_number, b);
    if (s === "avl") avl++;
    else if (s === "rac") rac++;
    else booked++;
  }
  return { avl, rac, booked };
}

function coachStatusLabel(stats: CoachStats): {
  text: string;
  tone: "avl" | "wl" | "full";
} {
  if (stats.avl === 0 && stats.rac === 0) return { text: "FULL", tone: "full" };
  if (stats.avl === 0) return { text: `WL ${stats.rac}`, tone: "wl" };
  return { text: `${stats.avl} avl`, tone: "avl" };
}

export function CoachLayout({
  coaches,
  defaultClass,
  fromCode,
  toCode,
  date,
}: {
  coaches: TrainCoach[];
  defaultClass: string;
  fromCode: string;
  toCode: string;
  date: string | null;
}) {
  const availableClasses = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    coaches.forEach((c) => {
      if (!seen.has(c.train_class)) {
        seen.add(c.train_class);
        out.push(c.train_class);
      }
    });
    return out;
  }, [coaches]);

  const initialClass = availableClasses.includes(defaultClass)
    ? defaultClass
    : (availableClasses[0] ?? "SL");

  const [classFilter, setClassFilter] = useState(initialClass);
  const filteredCoaches = useMemo(
    () => coaches.filter((c) => c.train_class === classFilter),
    [coaches, classFilter]
  );

  const [selectedCoachNumber, setSelectedCoachNumber] = useState(
    filteredCoaches[0]?.coach_number ?? ""
  );
  const [selectedBerths, setSelectedBerths] = useState<Set<number>>(new Set());

  const selectedCoach =
    filteredCoaches.find((c) => c.coach_number === selectedCoachNumber) ??
    filteredCoaches[0];

  const handleClassChange = (cls: string) => {
    if (cls === classFilter) return;
    setClassFilter(cls);
    const next = coaches.find((c) => c.train_class === cls);
    setSelectedCoachNumber(next?.coach_number ?? "");
    setSelectedBerths(new Set());
  };

  const handleCoachChange = (coachNumber: string) => {
    if (coachNumber === selectedCoachNumber) return;
    setSelectedCoachNumber(coachNumber);
    setSelectedBerths(new Set());
  };

  const toggleBerth = (berth: number, state: BerthState) => {
    if (state !== "avl") return;
    setSelectedBerths((prev) => {
      const next = new Set(prev);
      if (next.has(berth)) {
        next.delete(berth);
      } else if (next.size < 6) {
        next.add(berth);
      }
      return next;
    });
  };

  const stats = selectedCoach ? coachStats(selectedCoach) : null;

  const aiSuggestion = (() => {
    if (filteredCoaches.length === 0) return null;
    let bestCoach = filteredCoaches[0];
    let bestAvl = coachStats(bestCoach).avl;
    for (const c of filteredCoaches.slice(1)) {
      const a = coachStats(c).avl;
      if (a > bestAvl) {
        bestAvl = a;
        bestCoach = c;
      }
    }
    const pattern = bayPattern(bestCoach.train_class);
    for (let b = 1; b <= bestCoach.total_seats; b++) {
      if (berthState(bestCoach.coach_number, b) !== "avl") continue;
      const type = pattern[(b - 1) % pattern.length];
      if (type === "LB") {
        return { coach: bestCoach.coach_number, berth: b, type };
      }
    }
    return null;
  })();

  const dateLabel = date ? format(parseISO(date), "EEE dd MMM") : null;
  const routeLabel =
    fromCode && toCode ? `${fromCode} → ${toCode}` : "Pick stations";

  if (coaches.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1e1e1c] p-12 text-center">
        <p className="text-foreground/50">No coach information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header: Pick your berth ── */}
      <div className="rounded-xl border border-white/10 bg-[#1e1e1c] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-foreground text-base font-semibold">
                Pick your berth
              </h3>
              {aiSuggestion && (
                <span className="border-accent-warm/30 bg-accent-warm/10 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                  <Sparkles className="text-accent-warm h-3 w-3" />
                  <span className="text-foreground/70">AI suggests</span>
                  <span className="text-accent-warm font-medium">
                    {aiSuggestion.coach} · {aiSuggestion.berth} (
                    {aiSuggestion.type})
                  </span>
                  <span className="text-foreground/40">· least swap risk</span>
                </span>
              )}
            </div>
            <p className="text-foreground/50 mt-2 text-xs">
              Live availability · {routeLabel}
              {dateLabel ? ` · ${dateLabel}` : ""} · {selectedBerths.size}{" "}
              passenger{selectedBerths.size === 1 ? "" : "s"} selected
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-foreground/40 text-xs">Class:</span>
            <div className="flex items-center gap-1.5">
              {availableClasses.map((cls) => {
                const active = cls === classFilter;
                return (
                  <button
                    key={cls}
                    onClick={() => handleClassChange(cls)}
                    className={`flex h-9 w-11 cursor-pointer items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                      active
                        ? "border-accent-warm/50 bg-accent-warm/10 text-accent-warm"
                        : "text-foreground/60 border-white/10 bg-transparent hover:bg-white/5"
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Coach selector row ── */}
      <div className="rounded-xl border border-white/10 bg-[#15161a] p-4">
        <div className="flex items-stretch gap-3">
          <div className="flex shrink-0 items-center gap-2 border-r border-white/10 pr-3">
            <div className="bg-foreground/5 flex h-12 w-14 items-center justify-center rounded-md">
              <TrainIcon className="text-foreground/40 h-5 w-5" />
            </div>
            <span className="text-foreground/40 text-[10px] tracking-wider uppercase">
              Loco
            </span>
          </div>

          <div className="flex flex-1 items-center gap-2 overflow-x-auto">
            {filteredCoaches.map((coach) => {
              const stats = coachStats(coach);
              const status = coachStatusLabel(stats);
              const active = coach.coach_number === selectedCoachNumber;
              return (
                <button
                  key={coach.coach_number}
                  onClick={() => handleCoachChange(coach.coach_number)}
                  className={`flex h-14 min-w-[68px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border transition-colors ${
                    active
                      ? "border-accent-warm bg-accent-warm/5"
                      : status.tone === "full"
                        ? "border-white/10 bg-white/[0.02] opacity-50"
                        : "border-white/15 bg-[#1e1e1c] hover:border-white/30"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${
                      active ? "text-accent-warm" : "text-foreground"
                    }`}
                  >
                    {coach.coach_number}
                  </span>
                  <span
                    className={`mt-0.5 text-[10px] ${
                      status.tone === "full"
                        ? "text-red-400"
                        : status.tone === "wl"
                          ? "text-amber-400"
                          : active
                            ? "text-accent-warm/80"
                            : "text-emerald-400/80"
                    }`}
                  >
                    {status.text}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-l border-white/10 pl-3 text-xs">
            <span className="text-foreground/40">→ Pantry</span>
            <span className="text-foreground/40">→ Guard</span>
          </div>
        </div>
      </div>

      {/* ── Selected coach detail ── */}
      {selectedCoach && stats && (
        <div className="rounded-xl border border-white/10 bg-[#1e1e1c] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-accent-warm/30 text-accent-warm flex h-10 w-12 items-center justify-center rounded-md text-xs font-semibold">
                {selectedCoach.coach_number}
              </span>
              <div>
                <p className="text-foreground text-sm font-medium">
                  {CLASS_LABELS[selectedCoach.train_class] ??
                    selectedCoach.train_class}{" "}
                  · Coach {selectedCoach.coach_number}
                </p>
                <p className="text-foreground/50 mt-0.5 text-xs">
                  {selectedCoach.total_seats} berths · {stats.avl} available
                  {stats.rac > 0 ? ` · ${stats.rac} RAC` : ""}
                </p>
              </div>
            </div>

            <div className="text-foreground/40 flex items-center gap-3 text-xs">
              <span>→ Entry</span>
              <span className="text-foreground/20">·</span>
              <span className="inline-flex items-center gap-1">
                <Info className="h-3 w-3" /> WC
              </span>
            </div>
          </div>

          <p className="text-foreground/30 mt-5 text-right text-[10px] tracking-wider uppercase">
            Direction of travel →
          </p>

          <div className="mt-2 overflow-x-auto pb-2">
            <BerthLayout
              coach={selectedCoach}
              selectedBerths={selectedBerths}
              onToggle={toggleBerth}
              aiSuggestedBerth={
                aiSuggestion &&
                aiSuggestion.coach === selectedCoach.coach_number
                  ? aiSuggestion.berth
                  : null
              }
            />
          </div>

          {/* Legend */}
          <div className="text-foreground/40 mt-5 flex flex-wrap items-center gap-4 text-[11px]">
            <LegendDot className="border border-white/15 bg-transparent" />
            Available
            <LegendDot className="border border-white/5 bg-white/[0.02] text-white/30" />
            Booked
            <LegendDot className="border border-orange-400/40 bg-orange-400/10 text-orange-300" />
            RAC
            <LegendDot className="border border-pink-300/40 bg-pink-300/20 text-pink-200" />
            Selected
            <LegendDot className="border-accent-warm/40 bg-accent-warm/20 text-accent-warm border" />
            AI suggested
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ className }: { className: string }) {
  return <span className={`inline-block h-3 w-3 rounded ${className}`} />;
}

// ── Berth Layout for selected coach ──
function BerthLayout({
  coach,
  selectedBerths,
  onToggle,
  aiSuggestedBerth,
}: {
  coach: TrainCoach;
  selectedBerths: Set<number>;
  onToggle: (berth: number, state: BerthState) => void;
  aiSuggestedBerth: number | null;
}) {
  const pattern = bayPattern(coach.train_class);
  const baySize = pattern.length;
  const sideCount = pattern.filter((t) => t === "SL" || t === "SU").length;
  const mainSize = baySize - sideCount;
  const numBays = Math.ceil(coach.total_seats / baySize);

  const bays: { main: number[]; side: number[] }[] = [];
  for (let bayIdx = 0; bayIdx < numBays; bayIdx++) {
    const base = bayIdx * baySize;
    const main: number[] = [];
    const side: number[] = [];
    for (let off = 1; off <= baySize; off++) {
      const berth = base + off;
      if (berth > coach.total_seats) break;
      if (off <= mainSize) main.push(berth);
      else side.push(berth);
    }
    bays.push({ main, side });
  }

  return (
    <div className="flex items-stretch gap-1.5">
      {/* ENTRY label */}
      <div className="flex w-7 items-center justify-center border-r border-dashed border-white/10">
        <span className="text-foreground/30 text-[10px] tracking-wider uppercase [text-orientation:mixed] [writing-mode:vertical-rl]">
          Entry
        </span>
      </div>

      {bays.map((bay, idx) => (
        <BayCell
          key={idx}
          bay={bay}
          coachNumber={coach.coach_number}
          pattern={pattern}
          mainSize={mainSize}
          selectedBerths={selectedBerths}
          onToggle={onToggle}
          aiSuggestedBerth={aiSuggestedBerth}
        />
      ))}
    </div>
  );
}

function BayCell({
  bay,
  coachNumber,
  pattern,
  mainSize,
  selectedBerths,
  onToggle,
  aiSuggestedBerth,
}: {
  bay: { main: number[]; side: number[] };
  coachNumber: string;
  pattern: string[];
  mainSize: number;
  selectedBerths: Set<number>;
  onToggle: (berth: number, state: BerthState) => void;
  aiSuggestedBerth: number | null;
}) {
  const isSleeper = mainSize === 6;
  const isTwoTier = mainSize === 4;

  const renderBerth = (berth: number) => {
    const offset = ((berth - 1) % pattern.length) + 1;
    const type = pattern[offset - 1];
    const state = berthState(coachNumber, berth);
    const selected = selectedBerths.has(berth);
    const suggested = aiSuggestedBerth === berth && !selected;
    return (
      <Berth
        key={berth}
        number={berth}
        type={type}
        state={state}
        selected={selected}
        suggested={suggested}
        onClick={() => onToggle(berth, state)}
      />
    );
  };

  return (
    // ← shrink-0 added here, gap thoda bigger
    <div className="flex shrink-0 items-center gap-2">
      {/* Main compartment */}
      <div className="rounded-lg border border-white/10 bg-white/[0.015] p-2.5">
        {isSleeper && bay.main.length === 6 && (
          <div className="grid grid-cols-3 gap-2">
            {/*
              Figma layout:
              Top row: berth 2 (UB) | berth 5 (UB) | berth 3 (MB)
              Bot row: berth 6 (MB) | berth 1 (LB) | berth 4 (LB)

              With pattern [LB, UB, MB, LB, UB, MB]:
              - bay.main[0] = berth 1 = LB
              - bay.main[1] = berth 2 = UB
              - bay.main[2] = berth 3 = MB
              - bay.main[3] = berth 4 = LB
              - bay.main[4] = berth 5 = UB
              - bay.main[5] = berth 6 = MB
            */}
            {/* Top row: UB, UB, MB → indices 1, 4, 2 */}
            {[bay.main[1], bay.main[4], bay.main[2]].map(renderBerth)}
            {/* Bot row: MB, LB, LB → indices 5, 0, 3 */}
            {[bay.main[5], bay.main[0], bay.main[3]].map(renderBerth)}
          </div>
        )}

        {isTwoTier && bay.main.length === 4 && (
          <div className="grid grid-cols-2 gap-2">
            {/* Top: UB UB → indices 1, 3 */}
            {[bay.main[1], bay.main[3]].map(renderBerth)}
            {/* Bot: LB LB → indices 0, 2 */}
            {[bay.main[0], bay.main[2]].map(renderBerth)}
          </div>
        )}

        {!isSleeper && !isTwoTier && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(bay.main.length, 2)}, minmax(0, 1fr))`,
            }}
          >
            {bay.main.map(renderBerth)}
          </div>
        )}
      </div>

      {/* Side berths — SU on top, SL on bottom */}
      {bay.side.length > 0 && (
        <div className="flex shrink-0 flex-col gap-2">
          {bay.side
            .slice()
            .sort((a, b) => b - a)
            .map(renderBerth)}
        </div>
      )}
    </div>
  );
}

// ── Individual berth chip ──
function Berth({
  number,
  type,
  state,
  selected,
  suggested,
  onClick,
}: {
  number: number;
  type: string;
  state: BerthState;
  selected: boolean;
  suggested: boolean;
  onClick: () => void;
}) {
  const baseStyle =
    "flex h-14 w-12 cursor-pointer flex-col items-center justify-center rounded-md border text-xs leading-none transition-colors";

  let style = baseStyle;
  if (selected) {
    style +=
      " border-pink-300/50 bg-pink-300/25 text-pink-100 hover:bg-pink-300/35";
  } else if (suggested) {
    style +=
      " border-accent-warm/50 bg-accent-warm/15 text-accent-warm hover:bg-accent-warm/25";
  } else if (state === "booked") {
    style +=
      " cursor-not-allowed border-white/[0.06] bg-white/[0.01] text-white/20";
  } else if (state === "rac") {
    style +=
      " border-orange-400/35 bg-orange-400/10 text-orange-300 hover:bg-orange-400/15";
  } else {
    style +=
      " border-white/15 bg-transparent text-foreground hover:border-white/30 hover:bg-white/5";
  }

  return (
    <button
      onClick={onClick}
      disabled={state === "booked"}
      className={style}
      aria-label={`Berth ${number} ${type} ${state}`}
    >
      <span className="text-sm font-semibold">{number}</span>
      <span className="text-foreground/40 mt-1 text-[10px]">{type}</span>
    </button>
  );
}
