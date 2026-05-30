import { api } from "./api";

export type PnrPassenger = {
  passenger_name: string;
  passenger_age: number;
  passenger_gender: string;
  passenger_status: string;
  allotted_berth: string;
  fare: number;
  seat_number: number;
  berth_type: string;
  coach_number: string;
};

export type PnrStatus = {
  pnr_number: string;
  booking_status: string;
  booked_at: string;
  journey_date: string;
  train_class: string;
  quota: string;
  total_fare: number;
  wl_type: string;
  wl_position: number;
  train_number: string;
  train_name: string;
  train_type: string;
  source_station_code: string;
  source_station_name: string;
  destination_station_code: string;
  destination_station_name: string;
  passengers: PnrPassenger[];
};

export const pnrApi = {
  checkStatus: (pnr: string) =>
    api.get<{ data: PnrStatus }>(`/pnr/${pnr}`).then((r) => r.data.data),
};
