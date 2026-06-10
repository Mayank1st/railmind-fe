"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addDays, format, isValid, parseISO } from "date-fns";
import {
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  Download,
  Home,
  Loader2,
  QrCode,
  ReceiptText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { computeFare, inr } from "@/lib/fare";
import { toApiError } from "@/lib/api";
import { bookingStatusMeta } from "@/lib/bookings";
import { berthLabel, genderShort } from "@/lib/passengers";
import { useBookingStore, type BookingPassenger } from "@/store/booking";
import { usePassengers } from "@/hooks/usePassengers";
import { usePnrStatus } from "@/hooks/usePnrStatus";
import { useDownloadTicket } from "@/hooks/useDownloadTicket";
import { useAuthStore } from "@/store/auth";
import { ReceiptDialog } from "@/components/booking/receipt-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BookingConfirmedPage() {
  const sp = useSearchParams();
  const store = useBookingStore();
  const { data: saved = [] } = usePassengers();
  const userEmail = useAuthStore((s) => s.user?.email);

  const [copied, setCopied] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const downloadTicket = useDownloadTicket();

  const journey = store.journey ?? {
    train: sp.get("train") ?? "—",
    name: sp.get("name") ?? "Train",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    dep: sp.get("dep")?.slice(0, 5) ?? "",
    arr: sp.get("arr")?.slice(0, 5) ?? "",
    date: sp.get("date"),
    cls: sp.get("class") ?? "SL",
    quota: sp.get("quota") ?? "GN",
  };

  const storePassengers: BookingPassenger[] = useMemo(() => {
    if (store.passengers.length) return store.passengers;
    const ids = (sp.get("pax") ?? "").split(",").filter(Boolean);
    return saved
      .filter((p) => ids.includes(p.id))
      .map((p) => ({ ...p, berth: p.berth_preference ?? "NP" }));
  }, [store.passengers, saved, sp]);

  const pnr = sp.get("pnr") ?? "—";
  const bookingId = store.bookingId ?? sp.get("booking_id") ?? "";
  const payment = store.payment;
  const email = userEmail ?? store.contact.email ?? "your email";

  // Real allotment — per-passenger seat, berth and settled status — lives on the
  // PNR endpoint (same source as the booking-detail page). Show the store's
  // passengers instantly, then swap in the real seats once the PNR resolves; on
  // a hard refresh (store cleared) the PNR in the URL still rebuilds the ticket.
  const pnrQuery = usePnrStatus(pnr === "—" ? null : pnr);
  const ticket = pnrQuery.data;

  const count = ticket?.passengers.length ?? storePassengers.length;
  const fare = computeFare(journey.cls, count);
  const totalPaid = store.totalFare ?? ticket?.total_fare ?? fare.total;

  // Render the real settled status — a paid booking can be confirmed, RAC, or
  // waitlisted — so never hardcode "Confirmed"/"CNF".
  const status = (
    ticket?.booking_status ??
    store.bookingStatus ??
    sp.get("status") ??
    "confirmed"
  ).toLowerCase();
  const statusMeta = bookingStatusMeta(status);
  const isConfirmed = status === "confirmed";
  const heroClass = isConfirmed
    ? "border-emerald-500/20 bg-[#102a1e]"
    : "border-amber-500/20 bg-[#2a2410]";
  const heroIconClass = isConfirmed ? "bg-emerald-500" : "bg-[#E8AA4D]";
  const heroTitle = isConfirmed ? "Confirmed!" : statusMeta.label;
  const heroLine = isConfirmed
    ? `${count === 1 ? "Your passenger has" : "All passengers have"} CNF status. E-ticket emailed to ${email}.`
    : `Payment received — ${
        count === 1 ? "your passenger is" : `all ${count} passengers are`
      } ${statusMeta.label}. We'll upgrade to CNF automatically if seats clear. Updates sent to ${email}.`;

  // Normalised ticket rows: prefer the real PNR allotment, fall back to the
  // store's selection (with computed fare) while the PNR is still loading.
  const rows: TicketRow[] = ticket
    ? ticket.passengers.map((p, i) => ({
        key: String(i),
        name: titleCase(p.passenger_name),
        ageGender: `${p.passenger_age}${genderShort(p.passenger_gender)}`,
        status: p.passenger_status,
        statusClass: paxStatusClass(p.passenger_status),
        seat: p.coach_number
          ? `${p.coach_number} · ${p.seat_number} (${p.berth_type})`
          : berthLabel(p.berth_type),
        fare: p.fare,
      }))
    : storePassengers.map((p) => ({
        key: p.id,
        name: p.full_name,
        ageGender: `${p.age}${genderShort(p.gender)}`,
        status: statusMeta.short,
        statusClass: statusMeta.className,
        seat: berthLabel(p.berth),
        fare: fare.perPax,
      }));
  const rowsLoading = rows.length === 0 && pnrQuery.isLoading;

  // We only carry the departure date; mark arrival as next-day for overnight legs.
  const depDate = journey.date ? fmt(journey.date, "EEE dd MMM") : "—";
  const arrDate = journey.date
    ? fmt(
        overnight(journey.dep, journey.arr)
          ? shiftIso(journey.date, 1)
          : journey.date,
        "EEE dd MMM"
      )
    : "—";

  function copyPnr() {
    if (pnr === "—") return;
    navigator.clipboard?.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownloadTicket() {
    if (!bookingId || downloadTicket.isPending) return;
    setTicketError(null);
    try {
      await downloadTicket.mutateAsync(bookingId);
    } catch (e) {
      setTicketError(
        toApiError(e).message || "Couldn't download the e-ticket."
      );
    }
  }

  return (
    <div className="app-container py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* ── Success hero ── */}
        <Card className={cn("shadow-none", heroClass)}>
          <CardContent className="flex flex-wrap items-start justify-between gap-6 p-8">
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  heroIconClass
                )}
              >
                <Check className="h-6 w-6 text-white" strokeWidth={3} />
              </span>
              <div>
                <h1 className="font-heading text-foreground text-4xl font-normal tracking-[-0.5px]">
                  {heroTitle}
                </h1>
                <p className="text-muted-foreground mt-1.5 max-w-md text-sm">
                  {heroLine}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                PNR
              </span>
              <span className="font-heading text-foreground mt-1 text-3xl tracking-[0.06em] tabular-nums">
                {pnr}
              </span>
              <button
                type="button"
                onClick={copyPnr}
                className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Ticket ── */}
        <Card className="bg-card/40 overflow-hidden border-white/8 py-0 shadow-none">
          <div className="h-1 bg-[#E8AA4D]" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">
                  {journey.train} · {journey.cls}
                </p>
                <h2 className="font-heading text-foreground mt-1 truncate text-2xl">
                  {journey.name}
                </h2>

                <div className="mt-5 flex items-center gap-5">
                  <div>
                    <p className="text-foreground text-3xl font-medium">
                      {journey.dep || "—"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {journey.from} · {depDate}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-foreground text-3xl font-medium">
                      {journey.arr || "—"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {journey.to} · {arrDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* E-ticket placeholder */}
              <div className="hidden h-28 w-32 shrink-0 items-center justify-center rounded-lg bg-white/90 sm:flex">
                <QrCode className="h-16 w-16 text-[#1a1a1a]" />
              </div>
            </div>

            {/* Passengers */}
            <Table className="mt-6">
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-8 text-xs tracking-wider uppercase">
                    #
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">
                    Passenger
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs tracking-wider uppercase">
                    Coach / Berth
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right text-xs tracking-wider uppercase">
                    Fare
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow
                    key={r.key}
                    className="border-white/8 hover:bg-transparent"
                  >
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {r.name}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {r.ageGender}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-0", r.statusClass)}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.seat}
                    </TableCell>
                    <TableCell className="text-foreground text-right tabular-nums">
                      {r.fare != null ? inr(r.fare) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {rowsLoading && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-6 text-center text-sm"
                    >
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Fetching your allotted seats…
                    </TableCell>
                  </TableRow>
                )}
                {!rowsLoading && rows.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-6 text-center text-sm"
                    >
                      Passenger details unavailable.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={handleDownloadTicket}
                disabled={!bookingId || downloadTicket.isPending}
                className="rounded-xl bg-[#E8AA4D] font-medium text-[#3d2817] hover:bg-[#D09840]"
              >
                {downloadTicket.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloadTicket.isPending
                  ? "Preparing…"
                  : "Download E-Ticket PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setReceiptOpen(true)}
                disabled={!bookingId}
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                <ReceiptText className="h-4 w-4" />
                View Receipt
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                <Link href="/bookings">
                  <Bookmark className="h-4 w-4" />
                  All Bookings
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>

            {ticketError && (
              <p className="mt-3 text-sm text-red-300">{ticketError}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Payment summary ── */}
        <Card className="bg-card/40 border-white/8 shadow-none">
          <CardContent className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
            <Summary label="Total paid">
              <span className="font-heading text-foreground text-xl">
                {inr(totalPaid)}
              </span>
            </Summary>
            <Summary label="Method">
              <span className="text-foreground">
                {payment ? `${payment.method} · ${payment.detail}` : "—"}
              </span>
            </Summary>
            <Summary label="Txn ID">
              <span
                title={payment?.txnId ?? undefined}
                className="text-foreground block truncate font-mono text-sm"
              >
                {payment?.txnId ?? "—"}
              </span>
            </Summary>
            <Summary label="Booked at">
              <span className="text-foreground">
                {payment?.paidAt ? fmt(payment.paidAt, "dd MMM, HH:mm") : "—"}
              </span>
            </Summary>
          </CardContent>
        </Card>
      </div>

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        bookingId={bookingId}
      />
    </div>
  );
}

type TicketRow = {
  key: string;
  name: string;
  ageGender: string;
  status: string;
  statusClass: string;
  seat: string;
  fare: number | null;
};

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
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

function Summary({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs tracking-wider uppercase">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function fmt(date: string, pattern: string) {
  const d = parseISO(date);
  return isValid(d) ? format(d, pattern) : date;
}

function shiftIso(date: string, days: number): string {
  const d = parseISO(date);
  return isValid(d) ? addDays(d, days).toISOString() : date;
}

// Arrival time earlier than departure ⇒ the journey crosses midnight.
function overnight(dep: string, arr: string): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
  };
  const d = toMin(dep);
  const a = toMin(arr);
  return d != null && a != null && a < d;
}
