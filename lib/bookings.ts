import { api } from "./api";

export type BookingStatus =
  | "payment_pending"
  | "confirmed"
  | "rac"
  | "waitlisted"
  | "cancelled";

function titleCase(s: string): string {
  return s
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function bookingStatusMeta(status: string | null | undefined): {
  label: string;
  short: string;
  className: string;
} {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return {
        label: "Confirmed",
        short: "CNF",
        className:
          "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
      };
    case "rac":
      return {
        label: "RAC",
        short: "RAC",
        className: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
      };
    case "waitlisted":
      return {
        label: "Waitlisted",
        short: "WL",
        className: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
      };
    case "payment_pending":
      return {
        label: "Payment Pending",
        short: "PAY",
        className: "bg-sky-500/15 text-sky-300 border border-sky-500/20",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        short: "CAN",
        className: "bg-red-500/15 text-red-300 border border-red-500/20",
      };
    default:
      return {
        label: status ? titleCase(status) : "—",
        short: status ? status.slice(0, 3).toUpperCase() : "—",
        className: "text-muted-foreground border border-white/10 bg-white/10",
      };
  }
}

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

// Server-side tabs for the full "My bookings" list.
export type BookingFilter = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";

export type PageMeta = {
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type PagedJourneys = {
  journeys: Journey[];
  meta: PageMeta;
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

export type CreatedBooking = {
  booking_id: string;
  pnr_number: string;
  booking_status: string;
  train_number: string;
  train_name: string;
  journey_date: string;
  from_station: string;
  to_station: string;
  train_class: string;
  quota: string;
  total_fare: number | string;
  availability: "AVAILABLE" | "RAC" | "WL" | string;
  wl_type: string | null;
  next_wl_position: number | null;
  train_id?: string;
  user_id?: string;
  user_name?: string;
  source_station?: string;
  destination_station?: string;
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
  // "CHART PREPARED" | "CHART NOT PREPARED" — set once the railway prepares the
  // chart; after this each passenger's status is final.
  chart_status?: string;
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

  // Paginated + server-filtered list backing the full "My bookings" page.
  // Response shape: { data: Journey[], meta: { total, page, size, pages } }.
  listPaged: (params: {
    filter: BookingFilter;
    page: number;
    size: number;
  }): Promise<PagedJourneys> =>
    api
      .get<{ data: Journey[]; meta: PageMeta }>("/bookings/", { params })
      .then((r) => ({ journeys: r.data.data ?? [], meta: r.data.meta })),

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
