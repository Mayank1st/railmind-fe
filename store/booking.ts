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
  train_type?: string;
};

export type BookingPassenger = Passenger & { berth: string };

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
  totalFare: number | null;
  availability: string | null;
  bookingStatus: string | null;
  paidBookingId: string | null;
  pnr: string | null;
  completedStep: number;
  setBooking: (booking: {
    journey: BookingJourney;
    passengers: BookingPassenger[];
    contact: { email: string; phone: string };
  }) => void;
  setBookingResult: (result: {
    bookingId: string | null;
    totalFare: number | null;
    availability: string | null;
  }) => void;
  setPayment: (payment: BookingPayment | null) => void;
  setBookingStatus: (status: string | null) => void;
  setPaid: (bookingId: string, pnr: string | null) => void;
  markStepComplete: (step: number) => void;
  clear: () => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  journey: null,
  passengers: [],
  contact: { email: "", phone: "" },
  payment: null,
  bookingId: null,
  totalFare: null,
  availability: null,
  bookingStatus: null,
  paidBookingId: null,
  pnr: null,
  completedStep: 0,
  setBooking: (booking) => set(booking),
  setBookingResult: ({ bookingId, totalFare, availability }) =>
    set({
      bookingId,
      totalFare,
      availability,
      payment: null,
      bookingStatus: null,
      paidBookingId: null,
      pnr: null,
    }),
  setPayment: (payment) => set({ payment }),
  setBookingStatus: (bookingStatus) => set({ bookingStatus }),
  setPaid: (paidBookingId, pnr) => set({ paidBookingId, pnr }),
  markStepComplete: (step) =>
    set((s) => ({ completedStep: Math.max(s.completedStep, step) })),
  clear: () =>
    set({
      journey: null,
      passengers: [],
      contact: { email: "", phone: "" },
      payment: null,
      bookingId: null,
      totalFare: null,
      availability: null,
      bookingStatus: null,
      paidBookingId: null,
      pnr: null,
      completedStep: 0,
    }),
}));
