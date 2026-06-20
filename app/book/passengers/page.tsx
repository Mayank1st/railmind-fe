"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { ArrowRight, Loader2, Pencil, Plus, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import {
  genderShort,
  passengerDoc,
  passengerTag,
  BERTH_OPTIONS,
  type Passenger,
} from "@/lib/passengers";
import { useBookingStore } from "@/store/booking";
import { usePassengers } from "@/hooks/usePassengers";
import { useCreatePassenger } from "@/hooks/useCreatePassenger";
import { useFarePreview } from "@/hooks/useFarePreview";
import { inr } from "@/lib/fare";
import { normalizeIdNumber } from "@/lib/document";
import { MobileActionBar } from "@/components/booking/mobile-action-bar";
import {
  draftToPayload,
  EMPTY_DRAFT,
  isDraftValid,
  PassengerFields,
  type PassengerDraft,
} from "@/components/passengers/passenger-fields";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUOTA_LABEL: Record<string, string> = {
  GN: "General",
  TQ: "Tatkal",
  PT: "Premium Tatkal",
  LD: "Ladies",
  LB: "Lower Berth",
  HP: "Handicapped",
  DF: "Defence",
  SS: "Senior Citizen",
  FT: "Foreign Tourist",
};

// Display-only base fares (no fare field in the API yet).
const BASE_FARE: Record<string, number> = {
  SL: 655,
  "3A": 1745,
  "2A": 2515,
  "1A": 4250,
  CC: 905,
  "2S": 355,
  FC: 2100,
  "3E": 1490,
};

export default function BookingPassengersPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const train = sp.get("train") ?? "—";
  const name = sp.get("name") ?? "Train";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const dep = sp.get("dep")?.slice(0, 5) ?? "";
  const arr = sp.get("arr")?.slice(0, 5) ?? "";
  const dateRaw = sp.get("date");
  const cls = sp.get("class") ?? "SL";
  const quota = sp.get("quota") ?? "GN";
  const trainType = sp.get("type") ?? "";

  const dateLabel = useMemo(() => {
    if (!dateRaw) return "—";
    const d = parseISO(dateRaw);
    return isValid(d) ? format(d, "EEE, dd MMM") : dateRaw;
  }, [dateRaw]);

  const quotaLabel = QUOTA_LABEL[quota] ?? quota;
  const isTatkal = quota === "TQ" || quota === "PT";
  const maxPax = isTatkal ? 4 : 6;
  const fare = BASE_FARE[cls] ?? 655;

  const { data: saved = [], isLoading: passengersLoading } = usePassengers();
  const createPassenger = useCreatePassenger();
  const setBooking = useBookingStore((s) => s.setBooking);
  const markStepComplete = useBookingStore((s) => s.markStepComplete);

  // Rehydrate from the booking store when returning to this step (same train),
  // so the earlier selection + berths + contact are restored. A lazy useState
  // initializer captures the store snapshot once on mount — without touching a
  // ref during render (which React 19's hook rules disallow).
  const [seed] = useState(() => {
    const b = useBookingStore.getState();
    if (b.journey?.train === train && b.passengers.length > 0) {
      return {
        hydrated: true,
        local: b.passengers.filter((p) => p.id.startsWith("local-")),
        selected: new Set(b.passengers.map((p) => p.id)),
        berth: Object.fromEntries(b.passengers.map((p) => [p.id, p.berth])),
        email: b.contact.email || (user?.email ?? ""),
        phone: b.contact.phone || (user?.mobile ?? ""),
      };
    }
    return {
      hydrated: false,
      local: [] as Passenger[],
      selected: new Set<string>(),
      berth: {} as Record<string, string>,
      email: user?.email ?? "",
      phone: user?.mobile ?? "",
    };
  });

  // Passengers added with "Skip saving" live only in this booking session.
  const [localPassengers, setLocalPassengers] = useState<Passenger[]>(
    seed.local
  );
  const passengers = useMemo(
    () => [...saved, ...localPassengers],
    [saved, localPassengers]
  );

  const [selected, setSelected] = useState<Set<string>>(seed.selected);
  const [berth, setBerth] = useState<Record<string, string>>(seed.berth);
  const [email, setEmail] = useState(seed.email);
  const [phone, setPhone] = useState(seed.phone);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Passenger | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Only saved passengers (real ids) can be edited via the API; "Skip saving"
  // locals (local-… ids) aren't persisted, so there's nothing to PATCH.
  function openEdit(p: Passenger) {
    if (p.id.startsWith("local-")) return;
    setEditing(p);
    setEditOpen(true);
  }

  // Pre-select the primary passenger once saved data arrives — unless we
  // restored a previous selection from the store. Adjusting state during render
  // (vs. in an effect) is React's recommended pattern for deriving from data
  // that just loaded, and avoids a cascading-render lint error.
  const [autoSelected, setAutoSelected] = useState(seed.hydrated);
  if (!autoSelected && saved.length) {
    setAutoSelected(true);
    const primary = saved.find((p) => p.is_primary);
    if (primary) setSelected(new Set([primary.id]));
  }

  // Keep the booking store in sync so the stepper can move forward with the
  // latest selection (skip the load transient so we don't clobber the store).
  useEffect(() => {
    if (passengersLoading) return;
    const chosen = passengers
      .filter((p) => selected.has(p.id))
      .map((p) => ({ ...p, berth: berth[p.id] ?? p.berth_preference ?? "NP" }));
    setBooking({
      journey: {
        train,
        name,
        from,
        to,
        dep,
        arr,
        date: dateRaw,
        cls,
        quota,
        train_type: trainType,
      },
      passengers: chosen,
      contact: { email, phone },
    });
  }, [
    passengersLoading,
    passengers,
    selected,
    berth,
    email,
    phone,
    train,
    name,
    from,
    to,
    dep,
    arr,
    dateRaw,
    cls,
    quota,
    trainType,
    setBooking,
  ]);

  const count = selected.size;
  const total = count * fare; // estimate fallback
  const farePreview = useFarePreview(
    {
      train_number: train,
      from_station: from,
      to_station: to,
      train_class: cls,
      quota,
      journey_date: dateRaw ?? "",
      passenger_count: count,
      train_type: trainType,
    },
    Boolean(train && from && to && dateRaw) && count > 0
  );
  const fareTotal = farePreview.data?.total_fare ?? null;
  const fareLoading = count > 0 && farePreview.isLoading;

  function select(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.size < maxPax) next.add(id);
      return next;
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxPax) next.add(id);
      return next;
    });
  }

  // "Save passenger" — persist via the API, then select the returned record.
  async function savePassenger(draft: PassengerDraft) {
    try {
      const created = await createPassenger.mutateAsync(draftToPayload(draft));
      select(created.id);
      setAdding(false);
    } catch {
      // error surfaced inline in the form
    }
  }

  // "Skip saving" — keep the passenger for this booking only.
  function skipSavingPassenger(draft: PassengerDraft) {
    const local: Passenger = {
      id: `local-${Date.now()}`,
      full_name: draft.full_name.trim(),
      age: Number(draft.age),
      gender: draft.gender,
      id_type: draft.id_type,
      id_number: normalizeIdNumber(draft.id_number),
      berth_preference: draft.berth_preference,
      is_primary: false,
    };
    setLocalPassengers((prev) => [...prev, local]);
    select(local.id);
    setAdding(false);
  }

  function continueToReview() {
    markStepComplete(1); // step 1 done → Review becomes reachable in the stepper
    const qs = new URLSearchParams({
      train,
      name,
      from,
      to,
      dep,
      arr,
      class: cls,
      quota,
      ...(trainType ? { type: trainType } : {}),
      ...(dateRaw ? { date: dateRaw } : {}),
      pax: Array.from(selected).join(","),
    });
    router.push(`/book/review?${qs.toString()}`);
  }

  return (
    <div className="app-container-narrow pt-8 pb-28 lg:pb-8">
      {/* Journey summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8AA4D]/20 bg-[#1f1810] px-5 py-3.5 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-[#E8AA4D]">{train}</span>
          <span className="text-foreground font-medium">{name}</span>
          <span className="text-muted-foreground">
            {from} {dep} <ArrowRight className="inline h-3.5 w-3.5" /> {to}{" "}
            {arr}
          </span>
        </div>
        <span className="text-muted-foreground">
          {dateLabel} · {cls} · {quotaLabel} · {count} pax
        </span>
      </div>

      {/* Stepper */}
      <div className="mt-8">
        <BookingStepper current={1} />
      </div>

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Left column ── */}
        <div>
          <h1 className="font-heading text-foreground text-4xl font-normal tracking-[-0.5px]">
            Who&apos;s travelling?
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Select up to {maxPax} passengers.
            {isTatkal ? " Tatkal allows max 4." : " Tatkal allows max 4."}
          </p>

          {/* Tip banner */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#E8AA4D]/25 bg-gradient-to-r from-[#3a2a12] to-[#241a0c] px-5 py-4 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#E8AA4D]" />
            <p className="text-white/80">
              <span className="font-semibold text-[#F0BF6A]">
                Lower-berth tip:
              </span>{" "}
              Passengers above 60 or female travellers get auto lower-berth
              preference if available.
            </p>
          </div>

          {/* Saved passengers */}
          <Card className="bg-card/40 mt-6 border-white/8 py-0 shadow-none">
            <CardContent className="px-0">
              <p className="text-muted-foreground border-b border-white/8 px-6 py-4 text-xs font-medium tracking-[0.12em] uppercase">
                Saved passengers
              </p>

              {passengersLoading ? (
                <div className="space-y-3 p-4">
                  <div className="h-14 animate-pulse rounded-lg bg-white/5" />
                  <div className="h-14 animate-pulse rounded-lg bg-white/5" />
                </div>
              ) : passengers.length === 0 ? (
                <p className="text-muted-foreground px-6 py-8 text-center text-sm">
                  No saved passengers yet. Add one below.
                </p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {passengers.map((p) => {
                    const isSelected = selected.has(p.id);
                    const tag = passengerTag(p);
                    return (
                      <li
                        key={p.id}
                        className={cn(
                          "flex items-center gap-4 px-6 py-4 transition-colors",
                          isSelected && "bg-[#E8AA4D]/[0.06]"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggle(p.id)}
                          disabled={!isSelected && count >= maxPax}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground text-[15px] font-medium">
                              {p.full_name}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {p.age} / {genderShort(p.gender)}
                            </span>
                            {tag && (
                              <Badge className="h-5 bg-[#3d2817] px-2 text-[10px] font-semibold tracking-wide text-[#E8AA4D]">
                                {tag}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {passengerDoc(p) || "No ID on file"}
                          </p>
                        </div>

                        {isSelected ? (
                          <Select
                            value={berth[p.id] ?? p.berth_preference ?? "NP"}
                            onValueChange={(v) =>
                              setBerth((b) => ({ ...b, [p.id]: v }))
                            }
                          >
                            <SelectTrigger className="h-9 w-[140px] bg-[#2a2a28] text-sm dark:bg-[#2a2a28] dark:hover:bg-[#2f2f2d]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BERTH_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            aria-label={`Edit ${p.full_name}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {adding ? (
            <AddPassengerForm
              saving={createPassenger.isPending}
              error={
                createPassenger.isError
                  ? "Could not save passenger. Try again."
                  : null
              }
              onSave={savePassenger}
              onSkip={skipSavingPassenger}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <Button
              variant="outline"
              onClick={() => setAdding(true)}
              className="mt-4 cursor-pointer rounded-full border-white/15 bg-transparent text-sm text-white/90 hover:bg-white/[0.04]"
            >
              <Plus className="h-4 w-4" />
              Add new passenger
            </Button>
          )}

          {/* Contact details */}
          <Card className="bg-card/40 mt-6 border-white/8 shadow-none">
            <CardContent className="p-6">
              <h2 className="font-heading text-foreground text-lg font-medium">
                Contact details
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                For tickets, alerts, and PNR updates.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="contact-email"
                    className="text-muted-foreground text-xs tracking-[0.12em] uppercase"
                  >
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-10 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="contact-phone"
                    className="text-muted-foreground text-xs tracking-[0.12em] uppercase"
                  >
                    Mobile
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="h-10 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column — Trip summary (desktop) ── */}
        <div className="hidden lg:block">
          <Card className="bg-card/40 sticky top-6 border-white/8 shadow-none">
            <CardContent className="p-6">
              <h2 className="font-heading text-foreground text-lg font-medium">
                Trip summary
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Train" value={train} />
                <SummaryRow label="Date" value={dateLabel} />
                <SummaryRow
                  label="Class · Quota"
                  value={`${cls} · ${quotaLabel}`}
                />
                <SummaryRow label="Passengers" value={`${count} / ${maxPax}`} />
              </dl>

              <div className="mt-5 flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {count} passenger{count === 1 ? "" : "s"} · total fare
                </span>
                <span className="text-foreground font-medium">
                  {fareLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : fareTotal != null ? (
                    inr(fareTotal)
                  ) : (
                    inr(total)
                  )}
                </span>
              </div>

              <Button
                onClick={continueToReview}
                disabled={count === 0}
                className="mt-5 w-full rounded-xl bg-[#E8AA4D] py-5 font-medium text-[#3d2817] hover:bg-[#D09840]"
              >
                Continue to Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PassengerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        passenger={editing}
      />

      {/* Mobile sticky action bar */}
      <MobileActionBar>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">
            {count} passenger{count === 1 ? "" : "s"}
          </p>
          <p className="font-heading text-foreground text-lg">
            {fareLoading ? "…" : inr(fareTotal ?? total)}
          </p>
        </div>
        <Button
          onClick={continueToReview}
          disabled={count === 0}
          className="shrink-0 rounded-xl bg-[#E8AA4D] px-6 py-5 font-medium text-[#3d2817] hover:bg-[#D09840]"
        >
          Review
          <ArrowRight className="h-4 w-4" />
        </Button>
      </MobileActionBar>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}

function AddPassengerForm({
  saving,
  error,
  onSave,
  onSkip,
  onCancel,
}: {
  saving: boolean;
  error: string | null;
  onSave: (draft: PassengerDraft) => void;
  onSkip: (draft: PassengerDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<PassengerDraft>(EMPTY_DRAFT);
  const valid = isDraftValid(draft);

  return (
    <Card className="bg-card/40 mt-4 border-white/8 shadow-none">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-foreground text-lg font-medium">
            New passenger
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground size-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5">
          <PassengerFields
            draft={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => onSave(draft)}
            disabled={!valid || saving}
            className="cursor-pointer rounded-full bg-[#E8AA4D] font-medium text-[#3d2817] hover:bg-[#D09840]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save passenger
          </Button>
          <Button
            variant="outline"
            onClick={() => onSkip(draft)}
            disabled={!valid || saving}
            className="rounded-full border-white/15 bg-transparent text-white/90 hover:bg-white/[0.04]"
          >
            Skip saving
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          <span className="font-medium text-white/70">Save passenger</span> adds
          them to your saved list for next time.{" "}
          <span className="font-medium text-white/70">Skip saving</span> uses
          them only for this booking.
        </p>
      </CardContent>
    </Card>
  );
}
