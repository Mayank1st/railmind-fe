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
    }
  | {
      payment_id: string;
      payment_method: "NETBANKING";
      netbanking_user: string;
      netbanking_password: string;
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
 * Whether the payment succeeded. Success doesn't always mean "confirmed" — the
 * booking may settle as rac/waitlisted — so we key off `payment_status` (and
 * the booking having left the payable state), not a hardcoded "confirmed".
 * We read these data fields rather than the envelope's top-level `success`,
 * which the backend has been observed to return as false even on a paid booking.
 */
export function isPaymentSuccess(res: ProcessPayment | null | undefined) {
  if (!res) return false;
  const payment = res.payment_status?.toLowerCase();
  const booking = res.booking_status?.toLowerCase();
  if (payment === "success") return true;
  return (
    payment !== "failed" &&
    (booking === "confirmed" || booking === "rac" || booking === "waitlisted")
  );
}

/**
 * A failed payment releases the held seat and moves the booking to `cancelled`.
 * Once cancelled, re-initiating payment on the same booking 422s (RM-PAY-005),
 * so the UI must treat this as terminal and send the user to rebook.
 */
export function isPaymentFailed(res: ProcessPayment | null | undefined) {
  if (!res) return false;
  return (
    res.payment_status?.toLowerCase() === "failed" ||
    res.booking_status?.toLowerCase() === "cancelled"
  );
}
