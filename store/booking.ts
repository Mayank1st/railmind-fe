import { create } from "zustand";
import type { Passenger } from "@/lib/passengers";

export type BookingJourney = {
  train: string;
  name: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  date: string | null;
  cls: string;
  quota: string;
};

// A selected passenger plus the berth chosen for this booking.
export type BookingPassenger = Passenger & { berth: string };

// What the user paid with — captured on a successful payment so the Confirmed
// screen can show the method / transaction / timestamp.
export type BookingPayment = {
  method: string; // "UPI" | "Card"
  detail: string; // upi id, or masked card number
  txnId: string; // payment_id
  paidAt: string | null;
};

type BookingState = {
  journey: BookingJourney | null;
  passengers: BookingPassenger[];
  contact: { email: string; phone: string };
  payment: BookingPayment | null;
  bookingId: string | null;
  completedStep: number;
  setBooking: (booking: {
    journey: BookingJourney;
    passengers: BookingPassenger[];
    contact: { email: string; phone: string };
  }) => void;
  setBookingId: (id: string | null) => void;
  setPayment: (payment: BookingPayment | null) => void;
  markStepComplete: (step: number) => void;
  clear: () => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  journey: null,
  passengers: [],
  contact: { email: "", phone: "" },
  payment: null,
  bookingId: null,
  completedStep: 0,
  setBooking: (booking) => set(booking),
  setBookingId: (bookingId) => set({ bookingId }),
  setPayment: (payment) => set({ payment }),
  markStepComplete: (step) =>
    set((s) => ({ completedStep: Math.max(s.completedStep, step) })),
  clear: () =>
    set({
      journey: null,
      passengers: [],
      contact: { email: "", phone: "" },
      payment: null,
      bookingId: null,
      completedStep: 0,
    }),
}));
