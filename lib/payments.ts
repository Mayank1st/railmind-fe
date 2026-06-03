import { api } from "./api";

// Returned by POST /payments/initiate.
export type InitiatePayment = {
  payment_id: string;
  booking_id: string;
  booking_pnr: string;
  amount: string;
  currency: string;
  mock_order_id: string;
  payment_status: string;
};

// Returned by POST /payments/process.
export type ProcessPayment = {
  payment_id: string;
  booking_pnr: string;
  payment_status: string;
  payment_method: string;
  booking_status: string;
  paid_at: string | null;
  failure_reason: string | null;
};

export type ProcessPaymentPayload =
  | { payment_id: string; payment_method: "UPI"; upi_id: string }
  | {
      payment_id: string;
      payment_method: "CARD";
      card_number: string;
      card_cvv: string;
      card_holder_name: string;
    };

export const paymentsApi = {
  initiate: (bookingId: string) =>
    api
      .post<{ data: InitiatePayment }>("/payments/initiate", {
        booking_id: bookingId,
      })
      .then((r) => r.data.data),

  process: (payload: ProcessPaymentPayload) =>
    api
      .post<{ data: ProcessPayment }>("/payments/process", payload)
      .then((r) => r.data.data),
};

/**
 * Whether the booking actually went through. The backend currently returns a
 * top-level `success: false` even on a paid+confirmed booking, so we decide
 * from the data fields rather than trusting the envelope.
 */
export function isPaymentConfirmed(res: ProcessPayment | null | undefined) {
  if (!res) return false;
  return (
    res.payment_status?.toLowerCase() === "success" ||
    res.booking_status?.toLowerCase() === "confirmed"
  );
}
