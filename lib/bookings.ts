import { api } from "./api";

export type BookingStatus = "confirmed" | "cancelled" | "waitlisted";

export type Journey = {
  booking_id: string;
  train_id: string;
  train_number: string;
  train_name: string;
  source_station: string;
  destination_station: string;
  user_id: string;
  user_name: string;
  pnr_number: string;
  booking_status: BookingStatus;
  journey_date: string;
};

export type JourneyAction = "UPCOMING" | "PAST";

export type JourneyListResponse = {
  count: number;
  journeys: Journey[];
};

export const bookingsApi = {
  list: (action: JourneyAction) =>
    api
      .get<{
        data: JourneyListResponse;
      }>("/bookings/upcoming-and-past-journey", { params: { action } })
      .then((r) => r.data.data),
};
