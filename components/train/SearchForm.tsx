"use client";

import { useState } from "react";
import { Search, ArrowRight, MapPin, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function SearchForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>();
  const [trainClass, setTrainClass] = useState("SL");
  const [quota, setQuota] = useState("GN");

  return (
    <div className="mt-12 rounded-2xl border border-white/10 bg-[#1e1e1c] p-6">
      <div className="flex items-end gap-3">
        {/* FROM */}
        <div className="flex-1">
          <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
            From
          </label>
          <div className="flex items-center gap-2 rounded-lg bg-[#2a2a28] px-4 py-3">
            <input
              type="text"
              placeholder="Source station"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-foreground flex-1 bg-transparent text-sm outline-none placeholder:text-white/90"
            />
            <MapPin className="h-4 w-4 text-white/40" />
          </div>
        </div>

        {/* Swap button */}
        <button className="mb-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* TO */}
        <div className="flex-1">
          <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
            To
          </label>
          <div className="flex items-center gap-2 rounded-lg bg-[#2a2a28] px-4 py-3">
            <input
              type="text"
              placeholder="Destination station"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-foreground flex-1 bg-transparent text-sm outline-none placeholder:text-white/90"
            />
            <MapPin className="h-4 w-4 text-white/30" />
          </div>
        </div>

        {/* JOURNEY DATE */}
        <div className="w-52">
          <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
            Journey Date
          </label>
          <Popover>
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
                onSelect={setDate}
                disabled={(d) => d < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* CLASS — w-28 se w-36 */}
        <div className="w-36">
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

        {/* QUOTA — w-32 se w-40 */}
        <div className="w-40">
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
        <button className="bg-accent-warm flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3 font-medium text-white hover:opacity-90">
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {/* Divider */}
      <div className="mt-4 border-t border-white/10" />

      {/* Row 2 — Checkboxes + Recent */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/50">
            <Checkbox className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm cursor-pointer !border-white/30 !bg-white" />
            Tatkal
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/50">
            <Checkbox className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm cursor-pointer !border-white/30 !bg-white" />
            Ladies quota
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/50">
            <Checkbox className="data-[state=checked]:!border-accent-warm data-[state=checked]:!bg-accent-warm cursor-pointer !border-white/30 !bg-white" />
            Lower berth
          </label>
        </div>

        <div className="text-sm text-white/40">
          Recent:{" "}
          <span className="text-accent-warm cursor-pointer hover:underline">
            BCT → NDLS
          </span>
          {" · "}
          <span className="text-accent-warm cursor-pointer hover:underline">
            SBC → MAS
          </span>
        </div>
      </div>
    </div>
  );
}
