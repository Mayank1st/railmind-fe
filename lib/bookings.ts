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

export type CreateBookingPayload = {
  train_number: string;
  journey_date: string; // yyyy-MM-dd
  from_station: string;
  to_station: string;
  train_class: string;
  quota: string;
  passengers: { passenger_id: string; berth_preference: string }[];
};

// Returned by POST /bookings/. booking_status is "pending" until payment, so
// it's wider than BookingStatus — keep it loose.
export type CreatedBooking = {
  booking_id: string;
  train_id: string;
  train_number: string;
  train_name: string;
  source_station: string;
  destination_station: string;
  user_id: string;
  user_name: string;
  pnr_number: string;
  booking_status: string;
  journey_date: string;
};

// Returned by GET /bookings/{id}.
export type BookingDetail = {
  booking_id: string;
  pnr_number: string;
  booking_status: string;
  journey_date: string;
  train_class: string;
  quota: string;
  total_fare: string;
  source_station_name: string;
  source_station_code: string;
  destination_station_name: string;
  destination_station_code: string;
};

export type CancelledBooking = {
  booking_id: string;
  pnr_number: string;
  booking_status: string;
};

export const bookingsApi = {
  list: (action: JourneyAction) =>
    api
      .get<{
        data: JourneyListResponse;
      }>("/bookings/upcoming-and-past-journey", { params: { action } })
      .then((r) => r.data.data),

  create: (payload: CreateBookingPayload) =>
    api
      .post<{ data: CreatedBooking }>("/bookings/", payload)
      .then((r) => r.data.data),

  get: (id: string) =>
    api
      .get<{ data: BookingDetail }>(`/bookings/${id}`)
      .then((r) => r.data.data),

  cancel: (id: string) =>
    api
      .post<{ data: CancelledBooking }>(`/bookings/${id}/cancel`)
      .then((r) => r.data.data),
};
