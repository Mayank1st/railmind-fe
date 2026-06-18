import { api } from "./api";

// One stop on the live route (GET /train/{n}/live-status).
export type LiveRouteStop = {
  station_code: string;
  station_name: string;
  sequence_number: number;
  scheduled_arrival: string | null;
  actual_arrival: string | null;
  scheduled_departure: string | null;
  actual_departure: string | null;
  arrival_delay_minutes: number | null;
  departure_delay_minutes: number | null;
  distance_km: number;
  halt_minutes: number | null;
  platform_number: string | null;
  day_number: number | null;
  is_departed: boolean;
  is_current: boolean;
};

export type LiveStatus = {
  train_number: string;
  train_name: string;
  journey_date: string;
  current_station_code: string;
  current_station_name: string;
  current_delay_minutes: number;
  last_reported_at: string;
  expected_platform: string | null;
  route: LiveRouteStop[];
  is_stale: boolean;
  source: string;
  fetched_at: string;
};

export const liveApi = {
  // GET /train/{trainNumber}/live-status?journey_date=YYYY-MM-DD
  status: (trainNumber: string, journeyDate: string) =>
    api
      .get<{ data: LiveStatus }>(`/train/${trainNumber}/live-status`, {
        params: { journey_date: journeyDate },
      })
      .then((r) => r.data.data),
};
