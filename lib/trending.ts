import { api } from "./api";

export type DemandLevel = "HIGH" | "MEDIUM" | "LOW";

export interface WeeklyTrendingRoute {
  demand_level: DemandLevel;
  source_station_code: string;
  source_station_name: string;
  destination_station_code: string;
  destination_station_name: string;
  train_number: string | null;
  train_name: string | null;
  avg_duration_minutes: number | null;
  min_fare: number | null;
  search_count: number;
}

export interface WeeklyTrendingData {
  week_start: string | null; // null until the first weekly compute has run
  routes: WeeklyTrendingRoute[];
}

export interface PopularDestination {
  rank: number; // 1 = most searched; list arrives pre-sorted
  destination_station_code: string;
  destination_station_name: string;
  origin_station_code: string;
  origin_station_name: string;
  trains_count: number | null;
  train_number: string | null;
  train_name: string | null;
  min_fare: number | null;
  tagline: string | null;
  image_url: string | null; // Supabase 1200×600 webp, or null → render a fallback
  search_count: number;
}

export interface PopularDestinationsData {
  week_start: string | null; // null until the first weekly compute has run
  destinations: PopularDestination[];
}

export const DEMAND_STYLE: Record<
  DemandLevel,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  HIGH: {
    label: "High demand",
    badgeClassName: "border-rose-400/30 bg-rose-500/10 text-rose-300",
    dotClassName: "bg-rose-400",
  },
  MEDIUM: {
    label: "Medium demand",
    badgeClassName: "border-accent-warm/30 bg-[#2a2318] text-accent-warm",
    dotClassName: "bg-accent-warm",
  },
  LOW: {
    label: "Low demand",
    badgeClassName: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    dotClassName: "bg-emerald-400",
  },
};

export function formatAvgDuration(minutes: number | null): string | null {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m avg journey`;
}

export function formatMinFare(fare: number | null): string | null {
  if (fare == null) return null;
  return `₹${fare.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export const trendingApi = {
  getWeeklyRoutes: () =>
    api
      .get<{ data: WeeklyTrendingData }>("/trending/weekly-routes")
      .then((r) => r.data.data),
  getPopularDestinations: () =>
    api
      .get<{ data: PopularDestinationsData }>("/trending/popular-destinations")
      .then((r) => r.data.data),
};
