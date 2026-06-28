"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useStationSearch } from "@/hooks/useStationSearch";

type Props = {
  label: string;
  value: string;
  displayValue: string;
  onChange: (code: string, name: string) => void;
  placeholder: string;
};

export default function StationInput({
  label,
  value: _value,
  displayValue,
  onChange,
  placeholder,
}: Props) {
  const [query, setQuery] = useState(displayValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: stations, isLoading } = useStationSearch(query);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Active item scroll into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-station-item]");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const selectStation = (station: {
    station_code: string;
    station_name: string;
  }) => {
    onChange(station.station_code, station.station_name);
    setQuery(`${station.station_code} · ${station.station_name}`);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !stations.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < stations.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : stations.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && stations[activeIndex]) {
          selectStation(stations[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative min-w-0 flex-1">
      <label className="mb-2 block text-xs font-medium tracking-wider text-white/40 uppercase">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg bg-[#2a2a28] px-4 py-3">
        <input
          type="text"
          placeholder={placeholder}
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery(displayValue);
            if (displayValue.length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="text-foreground w-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/90"
        />
        <MapPin className="h-4 w-4 text-white/40" />
      </div>

      {open && stations.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#2a2a28] py-1 shadow-lg"
        >
          {stations.map((station, index) => (
            <button
              key={station.station_code}
              data-station-item
              onClick={() => selectStation(station)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                index === activeIndex
                  ? "text-foreground bg-white/10"
                  : "hover:bg-white/5"
              }`}
            >
              <span className="text-accent-warm font-medium">
                {station.station_code}
              </span>
              <span className="text-foreground/70">{station.station_name}</span>
            </button>
          ))}
        </div>
      )}

      {open && isLoading && (
        <div className="text-foreground/40 absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#2a2a28] px-4 py-3 text-sm">
          Loading stations...
        </div>
      )}

      {open && !isLoading && stations.length === 0 && query.length >= 2 && (
        <div className="text-foreground/40 absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#2a2a28] px-4 py-3 text-sm">
          No stations found
        </div>
      )}
    </div>
  );
}
