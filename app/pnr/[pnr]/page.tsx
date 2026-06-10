"use client";

import { useParams, useRouter } from "next/navigation";
import { usePnrStatus } from "@/hooks/usePnrStatus";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  AlertCircle,
  Copy,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusBadge: Record<string, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-400",
  waitlisted: "bg-amber-500/20 text-amber-400",
  rac: "bg-orange-500/20 text-orange-400",
  cancelled: "bg-red-500/20 text-red-400",
  CNF: "bg-emerald-500/20 text-emerald-400",
  WL: "bg-amber-500/20 text-amber-400",
  RAC: "bg-orange-500/20 text-orange-400",
  CAN: "bg-red-500/20 text-red-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

// ── Short code → human-readable label for passenger status ──
const passengerStatusLabel: Record<string, string> = {
  CNF: "CONFIRMED",
  WL: "WAITING",
  RAC: "RAC",
  CAN: "CANCELLED",
  CANCELLED: "CANCELLED",
};

const trainTypeBadge: Record<string, string> = {
  rajdhani: "bg-amber-500/20 text-amber-400",
  shatabdi: "bg-blue-500/20 text-blue-400",
  duronto: "bg-purple-500/20 text-purple-400",
  superfast: "bg-green-500/20 text-green-400",
  express: "bg-teal-500/20 text-teal-400",
  special: "bg-pink-500/20 text-pink-400",
};

const quotaLabel: Record<string, string> = {
  GN: "General",
  TQ: "Tatkal",
  PT: "Premium Tatkal",
  LD: "Ladies",
};

export default function PnrStatusPage() {
  const params = useParams();
  const pnr = params.pnr as string;

  const { data, isLoading, error, refetch, isRefetching } = usePnrStatus(pnr);

  const handleCopy = () => {
    navigator.clipboard.writeText(pnr);
  };

  const handleRecheck = () => {
    refetch();
  };

  // Loading
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#1a1a18]">
        <div className="mx-auto max-w-[800px] px-6 py-16">
          <div className="space-y-4">
            <div className="h-12 w-64 animate-pulse rounded bg-white/5" />
            <div className="h-64 animate-pulse rounded-xl bg-white/5" />
            <div className="h-48 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  // Error
  if (error) {
    return (
      <main className="min-h-screen bg-[#1a1a18]">
        <div className="mx-auto max-w-[800px] px-6 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="text-foreground mt-4 text-2xl">PNR not found</h1>
          <p className="text-foreground/50 mt-2">
            Check the PNR number and try again
          </p>
          <Link
            href="/pnr"
            className="bg-accent-warm mt-6 inline-block rounded-lg px-6 py-3 text-sm font-medium text-white"
          >
            Try Again
          </Link>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-[#1a1a18]">
      <div className="mx-auto max-w-[800px] px-6 py-12">
        {/* ── Header — PNR + Status + Actions ── */}
        <div className="mb-8">
          <p className="text-foreground/40 text-xs font-medium tracking-wider uppercase">
            PNR Number
          </p>
          <div className="mt-2 flex items-center gap-4">
            <h1 className="text-foreground font-mono text-4xl font-medium">
              {data.pnr_number}
            </h1>
            <span
              className={`rounded-md px-3 py-1 text-xs font-medium uppercase ${
                statusBadge[data.booking_status] ??
                "bg-gray-500/20 text-gray-400"
              }`}
            >
              {data.booking_status}
            </span>
            <button
              onClick={handleCopy}
              className="text-foreground flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              onClick={handleRecheck}
              disabled={isRefetching}
              className="text-foreground flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefetching ? (
                <Spinner className="size-3.5" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {isRefetching ? "Re-checking…" : "Re-check"}
            </button>
          </div>
        </div>

        {/* ── Train Card ── */}
        <div className="rounded-xl border border-white/10 bg-[#121713] p-6">
          {/* Train info + Journey date */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-foreground/50 text-sm">
                {data.train_number}
              </span>
              <span
                className={`rounded-md px-2.5 py-0.5 text-xs font-medium capitalize ${
                  trainTypeBadge[data.train_type] ??
                  "bg-gray-500/20 text-gray-400"
                }`}
              >
                {data.train_type}
              </span>
            </div>
            <div className="text-right">
              <p className="text-foreground/40 text-xs">Journey Date</p>
              <p className="text-foreground text-sm font-medium">
                {format(parseISO(data.journey_date), "EEE, dd MMM yyyy")}
              </p>
            </div>
          </div>

          {/* Train name */}
          <h3 className="text-foreground mt-2 text-xl font-medium">
            {data.train_name}
          </h3>

          {/* Route + Timing */}
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-foreground text-3xl font-medium">
                {data.source_station_code}
              </p>
              <p className="text-foreground/40 text-sm">
                {data.source_station_name}
              </p>
            </div>

            <div className="flex flex-1 items-center px-8">
              <div className="bg-foreground/15 h-px flex-1" />
              <ArrowRight className="text-foreground/20 mx-2 h-4 w-4" />
              <div className="bg-foreground/15 h-px flex-1" />
            </div>

            <div className="text-right">
              <p className="text-foreground text-3xl font-medium">
                {data.destination_station_code}
              </p>
              <p className="text-foreground/40 text-sm">
                {data.destination_station_name}
              </p>
            </div>
          </div>
        </div>

        {/* ── Passenger Table ── */}
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#121713]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 bg-white/[0.02] hover:bg-white/[0.02]">
                <TableHead className="text-foreground/40 w-10 px-6 py-3 text-xs font-medium tracking-wider uppercase">
                  #
                </TableHead>
                <TableHead className="text-foreground/40 px-2 py-3 text-xs font-medium tracking-wider uppercase">
                  Passenger
                </TableHead>
                <TableHead className="text-foreground/40 w-36 px-2 py-3 text-xs font-medium tracking-wider uppercase">
                  Booking Status
                </TableHead>
                <TableHead className="text-foreground/40 w-36 px-2 py-3 text-center text-xs font-medium tracking-wider uppercase">
                  Current Status
                </TableHead>
                <TableHead className="text-foreground/40 w-36 px-2 py-3 text-xs font-medium tracking-wider uppercase">
                  Coach / Berth
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.passengers.map((p, idx) => (
                <TableRow
                  key={idx}
                  className="border-white/5 hover:bg-white/[0.02]"
                >
                  <TableCell className="text-foreground/40 px-6 py-4 text-sm">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <p className="text-foreground text-sm font-medium">
                      {p.passenger_name}
                    </p>
                    <p className="text-foreground/40 text-xs">
                      {p.passenger_age}
                      {p.passenger_gender?.charAt(0).toUpperCase()}
                    </p>
                  </TableCell>
                  <TableCell className="text-foreground/60 px-2 py-4 text-sm">
                    {p.passenger_status}/{p.seat_number} ({data.wl_type})
                  </TableCell>
                  <TableCell className="px-2 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
                        statusBadge[p.passenger_status] ??
                        "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {passengerStatusLabel[p.passenger_status] ??
                        p.passenger_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground/60 px-2 py-4 text-sm">
                    {p.passenger_status === "CAN" ||
                    p.passenger_status === "CANCELLED"
                      ? "—"
                      : `${p.coach_number} / ${p.berth_type}-${p.seat_number}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ── Class & Quota + Chart Status ── */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#121713] p-5">
            <p className="text-foreground/40 text-xs font-medium tracking-wider uppercase">
              Class & Quota
            </p>
            <p className="text-foreground mt-2 text-lg font-medium">
              {data.train_class} · {quotaLabel[data.quota] ?? data.quota}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#121713] p-5">
            <p className="text-foreground/40 text-xs font-medium tracking-wider uppercase">
              Chart Status
            </p>
            <p className="text-foreground mt-2 text-lg font-medium">
              Not yet prepared
            </p>
          </div>
        </div>

        {/* ── Info Banner ── */}
        {data.booking_status === "cancelled" && (
          <div className="border-accent-warm/20 bg-accent-warm/5 mt-6 flex items-start gap-3 rounded-xl border px-5 py-4">
            <Sparkles className="text-accent-warm mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-foreground/70 text-sm">
              This booking was cancelled on{" "}
              {format(parseISO(data.booked_at), "dd MMM")} . A refund of{" "}
              <span className="text-foreground font-medium">
                ₹{data.total_fare.toFixed(0)}
              </span>{" "}
              was processed to the original payment method (3–5 business days).
            </p>
          </div>
        )}

        {data.booking_status === "waitlisted" && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-foreground/70 text-sm">
              Your booking is on waitlist position{" "}
              <span className="text-foreground font-medium">
                {data.wl_type} #{data.wl_position}
              </span>
              . Confirmation chances will improve as chart preparation
              approaches. Total fare:{" "}
              <span className="text-foreground font-medium">
                ₹{data.total_fare.toFixed(0)}
              </span>
            </p>
          </div>
        )}

        {data.booking_status === "confirmed" && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="text-foreground/70 text-sm">
              Your booking is confirmed. Total fare:{" "}
              <span className="text-foreground font-medium">
                ₹{data.total_fare.toFixed(0)}
              </span>
              . Have a great journey!
            </p>
          </div>
        )}

        {/* Back */}
        <div className="mt-8 text-center">
          <Link
            href="/pnr"
            className="text-accent-warm text-sm hover:underline"
          >
            ← Check another PNR
          </Link>
        </div>
      </div>
    </main>
  );
}
