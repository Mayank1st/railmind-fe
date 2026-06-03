"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { inr } from "@/lib/fare";
import { toApiError } from "@/lib/api";
import { useBooking } from "@/hooks/useBooking";
import { useCancelBooking } from "@/hooks/useCancelBooking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QUOTA_LABEL: Record<string, string> = {
  GN: "General",
  TQ: "Tatkal",
  PT: "Premium Tatkal",
  LD: "Ladies",
  SS: "Senior Citizen",
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, error } = useBooking(id);
  const cancelBooking = useCancelBooking();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const status = booking?.booking_status?.toLowerCase() ?? "";
  const isCancelled = status === "cancelled";

  async function onCancel() {
    setCancelError(null);
    try {
      await cancelBooking.mutateAsync(id);
      setConfirmOpen(false);
    } catch (e) {
      setCancelError(toApiError(e).message);
    }
  }

  return (
    <div className="app-container-narrow py-10">
      <Link
        href="/bookings"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        My Bookings
      </Link>

      {isLoading ? (
        <div className="bg-card/40 mt-6 h-80 w-full animate-pulse rounded-2xl" />
      ) : isError || !booking ? (
        <Card className="mt-6 border-red-500/20 bg-red-500/[0.04] shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-7 w-7 text-red-400" />
            <p className="text-foreground text-sm">
              {toApiError(error).message || "Couldn't load this booking."}
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/bookings">Back to bookings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header */}
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                PNR
              </p>
              <h1 className="font-heading text-foreground mt-1 text-4xl tracking-[0.06em] tabular-nums">
                {booking.pnr_number}
              </h1>
            </div>
            <Badge
              variant="outline"
              className={cn("h-7 border-0 text-sm", statusClass(status))}
            >
              {statusLabel(booking.booking_status)}
            </Badge>
          </div>

          {/* Route */}
          <Card className="bg-card/40 mt-6 border-white/8 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-heading text-foreground text-2xl">
                    {booking.source_station_code}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {booking.source_station_name}
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground h-5 w-5 shrink-0" />
                <div className="text-right">
                  <p className="font-heading text-foreground text-2xl">
                    {booking.destination_station_code}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {booking.destination_station_name}
                  </p>
                </div>
              </div>

              <div className="my-6 h-px bg-white/10" />

              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <Detail
                  label="Journey date"
                  value={fmtDate(booking.journey_date)}
                />
                <Detail
                  label="Class · Quota"
                  value={`${booking.train_class} · ${
                    QUOTA_LABEL[booking.quota] ?? booking.quota
                  }`}
                />
                <Detail
                  label="Total fare"
                  value={fareLabel(booking.total_fare)}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
            >
              <Link href={`/bookings/${id}/receipt`}>
                <Download className="h-4 w-4" />
                Receipt
              </Link>
            </Button>
            {!isCancelled && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCancelError(null);
                  setConfirmOpen(true);
                }}
                className="rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <XCircle className="h-4 w-4" />
                Cancel booking
              </Button>
            )}
          </div>
        </>
      )}

      {/* Cancel confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              PNR {booking?.pnr_number} will be cancelled. Refunds follow the
              cancellation policy and can take a few days.
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                Keep booking
              </Button>
            </DialogClose>
            <Button
              onClick={onCancel}
              disabled={cancelBooking.isPending}
              className="rounded-xl bg-red-500 font-medium text-white hover:bg-red-600"
            >
              {cancelBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Cancel booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-foreground mt-1">{value}</dd>
    </div>
  );
}

function statusClass(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-emerald-500/15 text-emerald-300";
    case "cancelled":
      return "bg-red-500/15 text-red-300";
    case "waitlisted":
      return "bg-amber-500/15 text-amber-300";
    default: // pending / unknown
      return "bg-white/10 text-muted-foreground";
  }
}

function statusLabel(status: string): string {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEE, dd MMM yyyy") : iso;
}

function fareLabel(fare: string): string {
  const n = Number(fare);
  return Number.isFinite(n) ? inr(n) : fare;
}
