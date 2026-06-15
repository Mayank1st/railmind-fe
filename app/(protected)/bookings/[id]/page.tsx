"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, isBefore, isValid, parseISO, subHours } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { inr, type FarePreview } from "@/lib/fare";
import { toApiError } from "@/lib/api";
import { bookingStatusMeta, type BookingDetail } from "@/lib/bookings";
import type { PnrPassenger, PnrStatus } from "@/lib/pnr";
import type { Receipt } from "@/lib/receipt";
import { useBooking } from "@/hooks/useBooking";
import { usePnrStatus } from "@/hooks/usePnrStatus";
import { useReceipt } from "@/hooks/useReceipt";
import { useFarePreview } from "@/hooks/useFarePreview";
import { useDownloadTicket } from "@/hooks/useDownloadTicket";
import { useCancelBooking } from "@/hooks/useCancelBooking";
import { ReceiptDialog } from "@/components/booking/receipt-dialog";
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
  const booking = useBooking(id);

  const pnrNumber = booking.data?.pnr_number ?? null;
  const status = booking.data?.booking_status?.toLowerCase() ?? "";
  const isCancelled = status === "cancelled";
  // A receipt only exists once the booking is paid (confirmed/rac/waitlisted).
  const isPaid =
    status === "confirmed" || status === "rac" || status === "waitlisted";

  const pnrStatus = usePnrStatus(pnrNumber);
  const receipt = useReceipt(id, isPaid);
  const downloadTicket = useDownloadTicket();
  const cancelBooking = useCancelBooking();

  // Paid bookings have a receipt with the real line items. Unpaid ones don't,
  // so pull the component split (base fare + charges + taxes) from the fare
  // engine — otherwise the "Fare breakdown" card would just echo the total.
  const passengerCount = pnrStatus.data?.passengers.length ?? 0;
  const farePreview = useFarePreview(
    {
      train_number: pnrStatus.data?.train_number ?? "",
      from_station: booking.data?.source_station_code ?? "",
      to_station: booking.data?.destination_station_code ?? "",
      train_class: booking.data?.train_class ?? "",
      quota: booking.data?.quota ?? "",
      journey_date: booking.data?.journey_date ?? "",
      passenger_count: passengerCount || 1,
      train_type: pnrStatus.data?.train_type ?? "",
    },
    !isPaid && !isCancelled && passengerCount > 0 && !!booking.data
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

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
        href="/bookings/all"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All bookings
      </Link>

      {booking.isLoading ? (
        <DetailSkeleton />
      ) : booking.isError || !booking.data ? (
        <Card className="mt-6 border-red-500/20 bg-red-500/[0.04] shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-7 w-7 text-red-400" />
            <p className="text-foreground text-sm">
              {toApiError(booking.error).message ||
                "Couldn't load this booking."}
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/bookings/all">Back to bookings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <SummaryCard
              booking={booking.data}
              pnr={pnrStatus.data}
              receipt={receipt.data}
              passengersLoading={pnrStatus.isLoading}
            />
            <FareCard
              receipt={receipt.data}
              farePreview={farePreview.data}
              loading={farePreview.isFetching}
              totalFare={booking.data.total_fare}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions
              pnrNumber={pnrNumber}
              isCancelled={isCancelled}
              downloading={downloadTicket.isPending}
              onDownload={() => downloadTicket.mutate(id)}
              onReceipt={() => setReceiptOpen(true)}
              onCancel={() => {
                setCancelError(null);
                setConfirmOpen(true);
              }}
            />
            {!isCancelled && (
              <ChartStatusCard
                journeyDate={booking.data.journey_date}
                departureTime={receipt.data?.journey.departure_time}
              />
            )}
            <HelpCard email={receipt.data?.seller.email} />
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              PNR {booking.data?.pnr_number} will be cancelled. Refunds follow
              the cancellation policy and can take a few days.
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

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        bookingId={id}
      />
    </div>
  );
}

function SummaryCard({
  booking,
  pnr,
  receipt,
  passengersLoading,
}: {
  booking: BookingDetail;
  pnr?: PnrStatus;
  receipt?: Receipt;
  passengersLoading: boolean;
}) {
  const meta = bookingStatusMeta(booking.booking_status);
  const trainNumber = pnr?.train_number ?? receipt?.journey.train_number;
  const trainName = pnr?.train_name ?? receipt?.journey.train_name;
  const departure = receipt?.journey.departure_time;

  return (
    <Card className="bg-card/40 overflow-hidden border-white/8 p-0 shadow-none">
      <div className="h-1 bg-[#E8AA4D]" />
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground font-mono text-xs">
                PNR {booking.pnr_number}
              </span>
              <Badge
                variant="outline"
                className={cn("h-5 text-[11px]", meta.className)}
              >
                {meta.short}
              </Badge>
            </div>
            <h1 className="font-heading text-foreground mt-2 text-3xl">
              {trainName ? titleCase(trainName) : `Train ${booking.pnr_number}`}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {[
                trainNumber,
                booking.train_class,
                QUOTA_LABEL[booking.quota] ?? booking.quota,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs tracking-wider uppercase">
              Journey
            </p>
            <p className="font-heading text-foreground mt-1 text-lg">
              {fmtDate(booking.journey_date)}
            </p>
          </div>
        </div>

        <div className="my-6 h-px bg-white/10" />

        {/* Route / timeline */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="shrink-0">
            <p className="font-heading text-foreground text-2xl sm:text-3xl">
              {departure ?? booking.source_station_code}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {departure
                ? `${booking.source_station_code} · ${titleCase(booking.source_station_name)}`
                : titleCase(booking.source_station_name)}
            </p>
          </div>

          <div className="flex flex-1 items-center gap-3">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8AA4D]" />
            <span className="h-px flex-1 bg-white/15" />
            <span className="text-muted-foreground shrink-0 text-xs">
              {fmtDateShort(booking.journey_date)}
            </span>
            <span className="h-px flex-1 bg-white/15" />
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8AA4D]" />
          </div>

          <div className="shrink-0 text-right">
            <p className="font-heading text-foreground text-2xl sm:text-3xl">
              {booking.destination_station_code}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {titleCase(booking.destination_station_name)}
            </p>
          </div>
        </div>

        {/* Passengers */}
        <div className="mt-7">
          <PassengerTable
            passengers={pnr?.passengers}
            loading={passengersLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PassengerTable({
  passengers,
  loading,
}: {
  passengers?: PnrPassenger[];
  loading: boolean;
}) {
  if (loading) {
    return <div className="bg-card/40 h-28 animate-pulse rounded-xl" />;
  }
  if (!passengers || passengers.length === 0) return null;

  return (
    <>
      {/* Mobile: stacked cards — a 5-column table can't fit a phone width, so
          the headers collide. */}
      <div className="divide-y divide-white/8 sm:hidden">
        {passengers.map((p, i) => (
          <div key={i} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-foreground min-w-0 text-sm font-medium">
                <span className="text-muted-foreground font-normal">
                  {i + 1}.{" "}
                </span>
                {titleCase(p.passenger_name)}
                <span className="text-muted-foreground font-normal">
                  {" · "}
                  {p.passenger_age}
                  {genderInitial(p.passenger_gender)}
                </span>
              </p>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                  paxStatusClass(p.passenger_status)
                )}
              >
                {p.passenger_status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground tabular-nums">
                {p.coach_number} · {p.seat_number} ({p.berth_type})
              </span>
              <span className="text-foreground tabular-nums">
                {inr(p.fare)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-white/10 text-[11px] tracking-[0.1em] uppercase">
              <th className="w-8 py-2 text-left font-medium">#</th>
              <th className="py-2 text-left font-medium">Passenger</th>
              <th className="py-2 text-left font-medium">Status</th>
              <th className="py-2 text-left font-medium">Seat / Berth</th>
              <th className="py-2 text-right font-medium">Fare</th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((p, i) => (
              <tr key={i} className="border-b border-white/8">
                <td className="text-muted-foreground py-3 tabular-nums">
                  {i + 1}
                </td>
                <td className="text-foreground py-3 pr-4 font-medium">
                  {titleCase(p.passenger_name)}
                  <span className="text-muted-foreground font-normal">
                    {" · "}
                    {p.passenger_age}
                    {genderInitial(p.passenger_gender)}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-medium",
                      paxStatusClass(p.passenger_status)
                    )}
                  >
                    {p.passenger_status}
                  </span>
                </td>
                <td className="text-foreground py-3 tabular-nums">
                  {p.coach_number} · {p.seat_number} ({p.berth_type})
                </td>
                <td className="text-foreground py-3 text-right tabular-nums">
                  {inr(p.fare)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FareCard({
  receipt,
  farePreview,
  loading,
  totalFare,
}: {
  receipt?: Receipt;
  farePreview?: FarePreview;
  loading?: boolean;
  totalFare: string;
}) {
  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-6">
        <h2 className="text-foreground text-sm font-semibold">
          Fare breakdown
        </h2>
        {receipt ? (
          // Paid — real receipt line items.
          <dl className="mt-4 space-y-2.5">
            {receipt.line_items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <dt className="text-muted-foreground">
                  {item.description}
                  {item.qty > 1 && (
                    <span className="text-muted-foreground/70">
                      {" "}
                      ({item.qty} × {inr(item.rate)})
                    </span>
                  )}
                </dt>
                <dd className="text-foreground tabular-nums">
                  {inr(item.amount)}
                </dd>
              </div>
            ))}
            <FareTotal label="Total paid" value={inr(receipt.total_paid)} />
          </dl>
        ) : farePreview ? (
          // Unpaid — component split from the fare engine.
          <dl className="mt-4 space-y-2.5">
            <FareRow
              label={
                farePreview.passenger_count > 1
                  ? `Base fare (${farePreview.passenger_count} pax)`
                  : "Base fare"
              }
              value={farePreview.base_fare}
            />
            {farePreview.reservation_charge > 0 && (
              <FareRow
                label="Reservation charge"
                value={farePreview.reservation_charge}
              />
            )}
            {farePreview.superfast_charge > 0 && (
              <FareRow
                label="Superfast charge"
                value={farePreview.superfast_charge}
              />
            )}
            {farePreview.tatkal_charge > 0 && (
              <FareRow
                label="Tatkal charge"
                value={farePreview.tatkal_charge}
              />
            )}
            {farePreview.gst > 0 && (
              <FareRow label="GST" value={farePreview.gst} />
            )}
            {farePreview.irctc_charge > 0 && (
              <FareRow
                label="Convenience fee"
                value={farePreview.irctc_charge}
              />
            )}
            <FareTotal label="Total fare" value={inr(farePreview.total_fare)} />
          </dl>
        ) : loading ? (
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card/60 h-5 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <FareTotal label="Total fare" value={fareLabel(totalFare)} />
        )}
      </CardContent>
    </Card>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground tabular-nums">{inr(value)}</dd>
    </div>
  );
}

function FareTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/10 pt-3">
      <dt className="text-foreground font-medium">{label}</dt>
      <dd className="font-heading text-foreground text-lg tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function QuickActions({
  pnrNumber,
  isCancelled,
  downloading,
  onDownload,
  onReceipt,
  onCancel,
}: {
  pnrNumber: string | null;
  isCancelled: boolean;
  downloading: boolean;
  onDownload: () => void;
  onReceipt: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5">
        <h2 className="text-foreground text-sm font-semibold">Quick actions</h2>
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          <QuickTile
            variant="primary"
            icon={
              downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )
            }
            label="E-Ticket"
            onClick={onDownload}
            disabled={downloading || isCancelled}
          />
          <QuickTile
            icon={<FileText className="h-4 w-4" />}
            label="Receipt"
            onClick={onReceipt}
            disabled={isCancelled}
          />
          <QuickTile
            icon={<Search className="h-4 w-4" />}
            label="Re-check"
            href={pnrNumber ? `/pnr/${pnrNumber}` : "/pnr"}
          />
          {!isCancelled && (
            <QuickTile
              variant="danger"
              icon={<XCircle className="h-4 w-4" />}
              label="Cancel"
              onClick={onCancel}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// A compact, square action tile — icon-in-a-box on top, label below — so the
// quick actions read as a grid (like the dashboard shortcuts) instead of a
// stack of full-width buttons. Renders a Link when `href` is given, else a
// button; `variant` tints the icon box (primary = filled amber, danger = red).
function QuickTile({
  icon,
  label,
  variant = "default",
  href,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "default" | "danger";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "group bg-card/40 hover:bg-card/60 flex flex-col items-center gap-2 rounded-xl border border-white/8 p-3 text-center transition-colors hover:border-white/15 disabled:pointer-events-none disabled:opacity-50";
  const iconBox = cn(
    "flex h-9 w-9 items-center justify-center rounded-lg",
    variant === "primary"
      ? "bg-[#E8AA4D] text-[#3d2817]"
      : variant === "danger"
        ? "bg-red-500/15 text-red-300"
        : "bg-[#3d2817] text-[#E8AA4D]"
  );
  const labelCls = cn(
    "text-[11px] leading-tight font-medium",
    variant === "danger" ? "text-red-300" : "text-foreground"
  );
  const inner = (
    <>
      <span className={iconBox}>{icon}</span>
      <span className={labelCls}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={base}
    >
      {inner}
    </button>
  );
}

// Chart prep status, derived from departure − 4h. Indian Railways prepares the
// reservation chart ~4 hours before departure; once that moment passes the
// chart is considered prepared.
function ChartStatusCard({
  journeyDate,
  departureTime,
}: {
  journeyDate: string;
  departureTime?: string;
}) {
  const prep =
    departureTime && journeyDate
      ? (() => {
          const dep = parseISO(`${journeyDate}T${departureTime}:00`);
          return isValid(dep) ? subHours(dep, 4) : null;
        })()
      : null;
  const prepared = prep ? isBefore(prep, new Date()) : false;

  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5">
        <h2 className="text-foreground text-sm font-semibold">Chart status</h2>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              prepared ? "bg-emerald-400" : "bg-amber-400"
            )}
          />
          <span className="text-foreground text-sm">
            {prepared ? "Prepared" : "Not yet prepared"}
          </span>
        </div>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {prep
            ? prepared
              ? `Chart was prepared around ${format(prep, "HH:mm 'on' dd MMM")}.`
              : `Chart prepares 4h before departure (${format(prep, "HH:mm 'on' dd MMM")}).`
            : "Chart prepares around 4 hours before departure."}
        </p>
      </CardContent>
    </Card>
  );
}

function HelpCard({ email }: { email?: string }) {
  return (
    <Card className="bg-card/40 border-white/8 shadow-none">
      <CardContent className="p-5">
        <h2 className="text-foreground text-sm font-semibold">Need help?</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Email {email ?? "help@railmind.app"} or chat 24/7.
        </p>
        <Link
          href="/help"
          className="mt-3 inline-flex text-sm text-[#E8AA4D] hover:underline"
        >
          Open support chat →
        </Link>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="bg-card/40 h-96 animate-pulse rounded-2xl" />
        <div className="bg-card/40 h-40 animate-pulse rounded-2xl" />
      </div>
      <div className="space-y-6">
        <div className="bg-card/40 h-56 animate-pulse rounded-2xl" />
        <div className="bg-card/40 h-28 animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}

function genderInitial(gender: string): string {
  const g = gender?.toUpperCase();
  if (g === "FEMALE") return "F";
  if (g === "MALE") return "M";
  return g?.[0] ?? "";
}

function paxStatusClass(status: string): string {
  switch (status?.toUpperCase()) {
    case "CNF":
      return "bg-emerald-500/15 text-emerald-300";
    case "RAC":
    case "WL":
      return "bg-amber-500/15 text-amber-300";
    case "CAN":
      return "bg-red-500/15 text-red-300";
    default:
      return "text-muted-foreground bg-white/10";
  }
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEE, dd MMM yyyy") : iso;
}

function fmtDateShort(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd MMM") : iso;
}

function fareLabel(fare: string): string {
  const n = Number(fare);
  return Number.isFinite(n) ? inr(n) : fare;
}
