"use client";

import { AlertCircle, ArrowRight, Download, TrainFront, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { inr } from "@/lib/fare";
import { toApiError } from "@/lib/api";
import { useReceipt } from "@/hooks/useReceipt";
import type { Receipt } from "@/lib/receipt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function ReceiptDialog({
  open,
  onOpenChange,
  bookingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
}) {
  // Only hits the API once the modal is actually open.
  const { data, isLoading, isError, error, refetch, isFetching } = useReceipt(
    bookingId,
    open
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden p-0"
      >
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <DialogTitle className="text-base">Tax Invoice / Receipt</DialogTitle>
          <DialogDescription className="sr-only">
            Tax invoice and payment receipt for this booking.
          </DialogDescription>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={!data}
              className="rounded-lg border-white/12 bg-transparent hover:bg-white/5"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <DialogClose
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full p-1.5 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6">
          {isLoading || isFetching ? (
            <ReceiptSkeleton />
          ) : isError || !data ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="h-7 w-7 text-red-400" />
              <p className="text-foreground text-sm">
                {toApiError(error).message || "Couldn't load the receipt."}
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                Try again
              </Button>
            </div>
          ) : (
            <ReceiptBody receipt={data} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptBody({ receipt: r }: { receipt: Receipt }) {
  const isPaid = r.status?.toUpperCase() === "PAID";

  return (
    <div className="space-y-6">
      {/* Seller / invoice meta */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d2817] text-[#E8AA4D]">
            <TrainFront className="h-5 w-5" />
          </span>
          <div>
            <p className="text-foreground text-sm font-semibold">
              {r.seller.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {r.seller.website} · {r.seller.email}
            </p>
            <p className="text-muted-foreground text-xs">
              GSTIN: {r.seller.gstin}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-heading text-foreground text-xl tracking-[0.08em]">
            RECEIPT
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Invoice No: {r.invoice_no}
          </p>
          <p className="text-muted-foreground text-xs">
            Date: {r.invoice_date}
          </p>
          <p className="text-muted-foreground text-xs">PNR: {r.pnr_number}</p>
          <Badge
            className={cn(
              "mt-2 border-0",
              isPaid
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            )}
          >
            {isPaid ? "✓ " : ""}
            {r.status}
          </Badge>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Billed to / Journey */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
            Billed to
          </p>
          <p className="text-foreground mt-1.5 font-medium">
            {r.billed_to.name}
          </p>
          <p className="text-muted-foreground text-sm">{r.billed_to.email}</p>
          <p className="text-muted-foreground text-sm">{r.billed_to.phone}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
            Journey
          </p>
          <p className="text-foreground mt-1.5 font-medium">
            {r.journey.train_number} {r.journey.train_name}
          </p>
          <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
            {r.journey.from_station}
            <ArrowRight className="h-3.5 w-3.5" />
            {r.journey.to_station} · {r.journey.train_class} ·{" "}
            {r.journey.quota_label}
          </p>
          <p className="text-muted-foreground text-sm">
            {r.journey.journey_date} · {r.journey.departure_time}
          </p>
        </div>
      </div>

      {/* Line items */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-white/10 text-[11px] tracking-[0.12em] uppercase">
            <th className="py-2 text-left font-medium">Description</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Rate</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {r.line_items.map((item, i) => (
            <tr key={i} className="border-b border-white/8">
              <td className="text-foreground py-3 pr-4">{item.description}</td>
              <td className="text-muted-foreground py-3 text-right tabular-nums">
                {item.qty}
              </td>
              <td className="text-muted-foreground py-3 text-right tabular-nums">
                {inr(item.rate)}
              </td>
              <td className="text-foreground py-3 text-right tabular-nums">
                {inr(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex w-full max-w-[260px] items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground tabular-nums">
            {inr(r.subtotal)}
          </span>
        </div>
        <div className="flex w-full max-w-[260px] items-center justify-between text-sm">
          <span className="text-muted-foreground">GST (included)</span>
          <span className="text-foreground tabular-nums">{inr(r.gst)}</span>
        </div>
        <div className="mt-1 flex w-full max-w-[260px] items-center justify-between border-t border-white/10 pt-2">
          <span className="text-foreground font-medium">Total Paid</span>
          <span className="font-heading text-foreground text-xl tabular-nums">
            {inr(r.total_paid)}
          </span>
        </div>
      </div>

      {/* Payment */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 sm:grid-cols-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
            Payment method
          </p>
          <p className="text-foreground mt-1 text-sm font-medium">
            {r.payment.method}
            {r.payment.method_detail ? ` · ${r.payment.method_detail}` : ""}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
            Transaction ID
          </p>
          <p className="text-foreground mt-1 font-mono text-sm break-all">
            {r.payment.transaction_id}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
            Gateway
          </p>
          <p className="text-foreground mt-1 text-sm font-medium">
            {r.payment.gateway}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground/70 text-center text-[11px]">
        This is a computer-generated receipt and does not require a signature.
      </p>
    </div>
  );
}

function ReceiptSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="h-20 w-40 animate-pulse rounded-lg bg-white/5" />
      </div>
      <div className="h-px bg-white/10" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-20 animate-pulse rounded-lg bg-white/5" />
        <div className="h-20 animate-pulse rounded-lg bg-white/5" />
      </div>
      <div className="h-28 animate-pulse rounded-lg bg-white/5" />
      <div className="h-16 animate-pulse rounded-lg bg-white/5" />
    </div>
  );
}
