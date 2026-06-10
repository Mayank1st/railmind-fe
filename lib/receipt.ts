import { api } from "./api";

export type ReceiptLineItem = {
  description: string;
  qty: number;
  rate: number;
  amount: number;
};

// Returned by GET /bookings/{id}/view-receipt. Amounts are numbers in INR.
export type Receipt = {
  invoice_no: string;
  invoice_date: string; // pre-formatted, e.g. "03 Jun 2026, 04:04"
  pnr_number: string;
  status: string; // "PAID"
  seller: {
    name: string;
    website: string;
    email: string;
    gstin: string;
  };
  billed_to: {
    name: string;
    email: string;
    phone: string;
  };
  journey: {
    train_number: string;
    train_name: string;
    from_station: string;
    from_station_name: string;
    to_station: string;
    to_station_name: string;
    train_class: string;
    train_class_label: string;
    quota: string;
    quota_label: string;
    journey_date: string;
    departure_time: string;
  };
  line_items: ReceiptLineItem[];
  subtotal: number;
  gst: number;
  total_paid: number;
  currency: string;
  payment: {
    method: string;
    method_detail: string | null;
    transaction_id: string;
    gateway: string;
    paid_at: string;
  };
};

export const receiptsApi = {
  view: (bookingId: string) =>
    api
      .get<{ data: Receipt }>(`/bookings/${bookingId}/view-receipt`)
      .then((r) => r.data.data),

  // Generates the e-ticket PDF and returns its public URL (`data` is the URL).
  ticketUrl: (bookingId: string) =>
    api
      .post<{ data: string }>(`/bookings/${bookingId}/receipt`)
      .then((r) => r.data.data),
};
