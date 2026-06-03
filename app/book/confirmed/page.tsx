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
  QrCode,
  ReceiptText,
} from "lucide-react";

import { computeFare, inr } from "@/lib/fare";
import { berthLabel, genderShort } from "@/lib/passengers";
import { useBookingStore, type BookingPassenger } from "@/store/booking";
import { usePassengers } from "@/hooks/usePassengers";
import { useAuthStore } from "@/store/auth";
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

  const passengers: BookingPassenger[] = useMemo(() => {
    if (store.passengers.length) return store.passengers;
    const ids = (sp.get("pax") ?? "").split(",").filter(Boolean);
    return saved
      .filter((p) => ids.includes(p.id))
      .map((p) => ({ ...p, berth: p.berth_preference ?? "NP" }));
  }, [store.passengers, saved, sp]);

  const count = passengers.length;
  const pnr = sp.get("pnr") ?? store.payment?.txnId ?? "—";
  const bookingId = store.bookingId ?? sp.get("booking_id") ?? "";
  const payment = store.payment;
  const email = userEmail ?? store.contact.email ?? "your email";
  const fare = computeFare(journey.cls, count);

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

  const receiptHref = bookingId ? `/bookings/${bookingId}/receipt` : "#";

  function copyPnr() {
    if (pnr === "—") return;
    navigator.clipboard?.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="app-container py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* ── Success hero ── */}
        <Card className="border-emerald-500/20 bg-[#102a1e] shadow-none">
          <CardContent className="flex flex-wrap items-start justify-between gap-6 p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <Check className="h-6 w-6 text-white" strokeWidth={3} />
              </span>
              <div>
                <h1 className="font-heading text-foreground text-4xl font-normal tracking-[-0.5px]">
                  Confirmed!
                </h1>
                <p className="text-muted-foreground mt-1.5 max-w-md text-sm">
                  {count === 1 ? "Your passenger has" : "All passengers have"}{" "}
                  CNF status. E-ticket emailed to {email}.
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
          <div className="h-1 bg-[#d6a572]" />
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
                {passengers.map((p, i) => (
                  <TableRow
                    key={p.id}
                    className="border-white/8 hover:bg-transparent"
                  >
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {p.full_name}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {p.age}
                        {genderShort(p.gender)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="border-0 bg-emerald-500/15 text-emerald-300">
                        CNF
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {berthLabel(p.berth)}
                    </TableCell>
                    <TableCell className="text-foreground text-right">
                      {inr(fare.perPax)}
                    </TableCell>
                  </TableRow>
                ))}
                {count === 0 && (
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
                asChild
                className="rounded-xl bg-[#d6a572] font-medium text-[#3d2817] hover:bg-[#c89a64]"
              >
                <Link href={receiptHref}>
                  <Download className="h-4 w-4" />
                  Download E-Ticket PDF
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                <Link href={receiptHref}>
                  <ReceiptText className="h-4 w-4" />
                  View Receipt
                </Link>
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
          </CardContent>
        </Card>

        {/* ── Payment summary ── */}
        <Card className="bg-card/40 border-white/8 shadow-none">
          <CardContent className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
            <Summary label="Total paid">
              <span className="font-heading text-foreground text-xl">
                {inr(fare.total)}
              </span>
            </Summary>
            <Summary label="Method">
              <span className="text-foreground">
                {payment ? `${payment.method} · ${payment.detail}` : "—"}
              </span>
            </Summary>
            <Summary label="Txn ID">
              <span className="text-foreground truncate font-mono text-sm">
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
    </div>
  );
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
