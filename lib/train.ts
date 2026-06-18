import { api } from "./api";

export enum TrainClass {
  SLEEPER = "SL",
  AC_3_TIER = "3A",
  AC_2_TIER = "2A",
  AC_1_TIER = "1A",
  AC_CHAIR = "CC",
  SECOND_SITTING = "2S",
  FIRST_CLASS = "FC",
  AC_3_ECONOMY = "3E",
}

export enum TrainQuota {
  GENERAL = "GN",
  TATKAL = "TQ",
  PREMIUM_TATKAL = "PT",
  LADIES = "LD",
  LOWER_BERTH = "LB",
  HANDICAPPED = "HP",
  DEFENCE = "DF",
  SENIOR_CITIZEN = "SS",
  FOREIGN_TOURIST = "FT",
}

export type Train = {
  train_number: string;
  train_name: string;
  train_type: string;
  from_station: string;
  from_name: string;
  to_station: string;
  to_name: string;
  departs: string;
  arrives: string;
  journey_km: number;
  duration_minutes?: number;
  runs_on_days: string[];
  runs_today: boolean | null;
  // false when the train is matched via a nearby station rather than the exact
  // searched station (only present when exact_only=false / nearby search).
  is_exact_match?: boolean;
};

export type TrainSearchPayload = {
  fromStationCode: string;
  toStationCode?: string;
  hours?: number;
  train_class?: TrainClass;
  journey_date?: string;
  // exact_only=true → only the searched station; false → also include nearby
  // stations (the "Nearby stations" toggle drives these two together).
  nearby_stations?: boolean;
  exact_only?: boolean;
  sort_by?: string;
  page?: number;
  size?: number;
};

export type TrainSearchMeta = {
  total: number;
  page: number;
  size: number;
  pages: number;
  from_time: string;
  to_time: string;
  nearby_stations: boolean;
};

// The API now returns the list in `data` and pagination/flags in `meta`; we
// fold them into one object so callers read `result.trains` / `result.meta`.
export type TrainSearchResult = {
  trains: Train[];
  meta: TrainSearchMeta;
};

export type TrainScheduleStop = {
  seq: number;
  station_code: string;
  station_name: string;
  arrival: string;
  departure: string;
  distance_km: number;
  halt_minutes: number;
  is_source: boolean;
  is_destination: boolean;
};

export type TrainScheduleResponse = {
  train_number: string;
  train_name: string;
  train_type: string;
  runs_on_days: string[];
  total_stops: number;
  schedule: TrainScheduleStop[];
};

export type TrainCoach = {
  coach_number: string;
  train_class: string;
  total_seats: number;
  is_ac: boolean;
};

export type TrainDetailsResponse = {
  train_number: string;
  train_name: string;
  coaches: TrainCoach[];
};

export type SeatAvailabilityResponse = {
  train_number: number;
  train_name: string;
  journey_date: string;
  from_station: string;
  to_station: string;
  train_class: TrainClass;
  quota: TrainQuota;
  availability_status: string;
  available_seats: number;
  available_rac_slots: number;
  wl_type: string;
  classes?: Array<{
    class_code: string;
    status: string;
    count: number;
  }>;
};

export const trainSearchApi = {
  trainSearch: (payload: TrainSearchPayload): Promise<TrainSearchResult> =>
    api
      .post<{ data: Train[]; meta: TrainSearchMeta }>("/train/search", payload)
      .then((r) => ({ trains: r.data.data ?? [], meta: r.data.meta })),

  getTrainDetails: (trainNumber: string) =>
    api
      .get<{ data: TrainDetailsResponse }>(`/train/${trainNumber}`)
      .then((r) => r.data.data),

  getTrainSchedule: (trainNumber: string) =>
    api
      .get<{ data: TrainScheduleResponse }>(`/train/${trainNumber}/schedule`)
      .then((r) => r.data.data),

  getSeatAvailability: (
    trainNumber: string,
    date: string | null,
    fromStation: string,
    toStation: string,
    trainClass: string,
    quota: string
  ) =>
    api
      .post<{ data: SeatAvailabilityResponse }>(
        `/train/${trainNumber}/seat-availability`,
        {
          journey_date: date,
          from_station: fromStation,
          to_station: toStation,
          train_class: trainClass,
          quota: quota,
        }
      )
      .then((r) => r.data.data),
};
