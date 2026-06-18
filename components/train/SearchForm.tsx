"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  CalendarIcon,
  MapPin,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StationInput from "@/components/train/StationInput";

export type SearchFormDefaults = {
  fromCode?: string;
  fromDisplay?: string;
  toCode?: string;
  toDisplay?: string;
  date?: Date;
  trainClass?: string;
  quota?: string;
  nearby?: boolean;
};

type SearchFormProps = {
  defaults?: SearchFormDefaults;
  onSubmitted?: () => void;
  className?: string;
};

export default function SearchForm({
  defaults,
  onSubmitted,
  className,
}: SearchFormProps = {}) {
  const router = useRouter();
  const [fromCode, setFromCode] = useState(defaults?.fromCode ?? "");
  const [fromDisplay, setFromDisplay] = useState(defaults?.fromDisplay ?? "");
  const [toCode, setToCode] = useState(defaults?.toCode ?? "");
  const [toDisplay, setToDisplay] = useState(defaults?.toDisplay ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(defaults?.date);
  const [trainClass, setTrainClass] = useState(defaults?.trainClass ?? "SL");
  const [quota, setQuota] = useState(defaults?.quota ?? "GN");
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [nearbyStations, setNearbyStations] = useState(
    defaults?.nearby ?? false
  );

  const handleSearch = () => {
    if (!fromCode || !toCode) return;

    const params = new URLSearchParams({
      from: fromCode,
      to: toCode,
      class: trainClass,
      quota: quota,
      hours: "48",
    });

    if (date) {
      params.set("date", format(date, "yyyy-MM-dd"));
    }
    // "Nearby stations" ON → search also covers nearby stations (exact_only=false).
    if (nearbyStations) {
      params.set("nearby", "1");
    }
    router.push(`/trains/search?${params.toString()}`);
    onSubmitted?.();
  };

  return (
    <div
      className={
        className ?? "mt-12 rounded-2xl border border-white/10 bg-[#121713] p-6"
      }
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* FROM */}
        <StationInput
          label="From"
          value={fromCode}
          displayValue={fromDisplay}
          onChange={(code, name) => {
            setFromCode(code);
            setFromDisplay(`${code} · ${name}`);
          }}
          placeholder="Source station"
        />

        {/* Swap button */}
        <button
          type="button"
          onClick={() => {
            setFromCode(toCode);
            setFromDisplay(toDisplay);
            setToCode(fromCode);
            setToDisplay(fromDisplay);
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-white/10 text-white/40 hover:text-white lg:mb-1 lg:self-auto"
        >
          <ArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" />
        </button>

        {/* TO */}
        <StationInput
          label="To"
          value={toCode}
          displayValue={toDisplay}
          onChange={(code, name) => {
            setToCode(code);
            setToDisplay(`${code} · ${name}`);
          }}
          placeholder="Destination station"
        />

        {/* Date / Class / Quota / Search — 2-col on mobile, inline on desktop */}
        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-end lg:gap-3">
          {/* JOURNEY DATE */}
          <div className="col-span-2 lg:w-52">
            <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
              Journey Date
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="text-foreground h-auto w-full cursor-pointer justify-between rounded-lg bg-[#2a2a28] px-4 py-3 text-sm font-normal hover:bg-[#333330]"
                >
                  {date ? format(date, "EEE, dd MMM") : "Select date"}
                  <CalendarIcon className="h-4 w-4 text-white/30" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-white/10 bg-[#2a2a28] p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false); // ← select hone pe close
                  }}
                  disabled={(d) => d < new Date()}
                  classNames={{
                    day_button: "cursor-pointer",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* CLASS */}
          <div className="lg:w-36">
            <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
              Class
            </label>
            <Select value={trainClass} onValueChange={setTrainClass}>
              <SelectTrigger className="text-foreground !h-auto w-full cursor-pointer rounded-lg border-0 bg-[#2a2a28] px-4 py-3 text-sm [&>svg]:opacity-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={2}
                className="border-white/10 bg-[#2a2a28] [&_[data-slot=select-item]]:cursor-pointer"
              >
                <SelectItem value="SL">SL</SelectItem>
                <SelectItem value="3A">3A</SelectItem>
                <SelectItem value="2A">2A</SelectItem>
                <SelectItem value="1A">1A</SelectItem>
                <SelectItem value="CC">CC</SelectItem>
                <SelectItem value="2S">2S</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* QUOTA */}
          <div className="lg:w-40">
            <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
              Quota
            </label>
            <Select value={quota} onValueChange={setQuota}>
              <SelectTrigger className="text-foreground !h-auto w-full cursor-pointer rounded-lg border-0 bg-[#2a2a28] px-4 py-3 text-sm [&>svg]:opacity-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={2}
                className="border-white/10 bg-[#2a2a28] [&_[data-slot=select-item]]:cursor-pointer"
              >
                <SelectItem value="GN">General</SelectItem>
                <SelectItem value="TQ">Tatkal</SelectItem>
                <SelectItem value="PT">Premium Tatkal</SelectItem>
                <SelectItem value="LD">Ladies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SEARCH BUTTON */}
          <button
            onClick={handleSearch}
            className="bg-accent-warm col-span-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-[#1a1a18] hover:opacity-90 lg:w-auto"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-4 border-t border-white/10" />

      {/* Row 2 — Filter options + Recent */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:flex-1 lg:items-stretch">
          {/* Flexible dates */}
          <button
            type="button"
            onClick={() => setFlexibleDates((v) => !v)}
            className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
              flexibleDates
                ? "border-accent-warm/40 bg-accent-warm/10"
                : "border-white/10 bg-[#252523] hover:border-white/20"
            }`}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-white/40" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/80">
                Flexible dates
              </p>
              <p className="text-xs text-white/30">Search ±1 day</p>
            </div>
            <div
              className={`h-4 w-4 shrink-0 rounded-full border transition-colors ${
                flexibleDates
                  ? "border-accent-warm bg-accent-warm/30"
                  : "border-white/30"
              }`}
            />
          </button>

          {/* Nearby stations */}
          <button
            type="button"
            onClick={() => setNearbyStations((v) => !v)}
            className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
              nearbyStations
                ? "border-accent-warm/40 bg-accent-warm/10"
                : "border-white/10 bg-[#252523] hover:border-white/20"
            }`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-white/40" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/80">
                Nearby stations
              </p>
              <p className="text-xs text-white/30">
                BCT, CST, LTT also covered
              </p>
            </div>
            <div
              className={`h-4 w-4 shrink-0 rounded-full border transition-colors ${
                nearbyStations
                  ? "border-accent-warm bg-accent-warm/30"
                  : "border-white/30"
              }`}
            />
          </button>

          {/* Likely to confirm only — coming soon, disabled */}
          <div className="flex flex-1 cursor-not-allowed items-center gap-3 rounded-xl border border-white/5 bg-[#252523]/50 px-4 py-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-white/25" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white/40">
                  Likely to confirm only
                </p>
                <span className="rounded-full border border-[#E8AA4D]/20 bg-[#E8AA4D]/10 px-2 py-0.5 text-xs whitespace-nowrap text-[#E8AA4D]/70">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-white/20">
                Hide trains with low confirmation chance
              </p>
            </div>
            <div className="h-4 w-4 shrink-0 rounded-full border border-white/15" />
          </div>
        </div>

        {/* Recent searches */}
        <div className="shrink-0 text-sm text-white/40">
          Recent:{" "}
          <span
            onClick={() => {
              setFromCode("BCT");
              setFromDisplay("BCT · Mumbai Centr");
              setToCode("NDLS");
              setToDisplay("NDLS · New Delhi");
            }}
            className="text-accent-warm cursor-pointer hover:underline"
          >
            BCT → NDLS
          </span>
          {" · "}
          <span
            onClick={() => {
              setFromCode("SBC");
              setFromDisplay("SBC · KSR Bengaluru");
              setToCode("MAS");
              setToDisplay("MAS · Chennai Ctrl");
            }}
            className="text-accent-warm cursor-pointer hover:underline"
          >
            SBC → MAS
          </span>
        </div>
      </div>
    </div>
  );
}
