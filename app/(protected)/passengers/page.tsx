"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  berthLabel,
  genderLabel,
  passengerDoc,
  passengerTag,
  type Passenger,
} from "@/lib/passengers";
import { usePassengers } from "@/hooks/usePassengers";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PassengersPage() {
  const { data: passengers = [], isLoading } = usePassengers();
  const [dialogOpen, setDialogOpen] = useState(false);
  // null = "add" mode, a passenger = "edit" mode.
  const [editing, setEditing] = useState<Passenger | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(p: Passenger) {
    setEditing(p);
    setDialogOpen(true);
  }

  return (
    <div className="app-container-narrow py-10">
      {/* Header */}
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-heading text-foreground text-5xl font-normal tracking-[-0.5px]">
            Saved passengers
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            {passengers.length} saved · Auto-fills during booking. ID is stored
            encrypted, masked everywhere.
          </p>
        </div>

        <Button
          onClick={openAdd}
          className="rounded-full bg-[#d6a572] px-5 font-medium text-[#3d2817] hover:bg-[#c89a64]"
        >
          <Plus className="h-4 w-4" />
          Add passenger
        </Button>
      </header>

      {/* Grid */}
      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[132px] animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {passengers.map((p) => (
            <PassengerCard
              key={p.id}
              passenger={p}
              onEdit={() => openEdit(p)}
            />
          ))}

          <button
            type="button"
            onClick={openAdd}
            className="text-muted-foreground hover:text-foreground bg-card/20 hover:bg-card/40 flex min-h-[132px] items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 text-sm transition-colors hover:border-white/20"
          >
            <Plus className="h-4 w-4" />
            Add new passenger
          </button>
        </div>
      )}

      <PassengerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        passenger={editing}
      />
    </div>
  );
}

function PassengerCard({
  passenger: p,
  onEdit,
}: {
  passenger: Passenger;
  onEdit: () => void;
}) {
  const tag = passengerTag(p);
  const doc = passengerDoc(p);
  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border border-white/8 p-5",
        p.is_primary ? "bg-[#d6a572]/[0.06]" : "bg-card/40"
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3d2817] text-sm font-medium text-[#d6a572]">
        {getInitials(p.full_name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-[15px] font-semibold">
            {p.full_name}
          </span>
          {tag && (
            <Badge className="h-5 bg-[#3d2817] px-2 text-[10px] font-semibold tracking-wide text-[#d6a572]">
              {tag}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {[p.age, genderLabel(p.gender), doc].filter(Boolean).join(" · ")}
        </p>
        <p className="text-muted-foreground/70 mt-3 text-xs">
          Default berth: {berthLabel(p.berth_preference)}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          aria-label={`Edit ${p.full_name}`}
          className="text-muted-foreground hover:text-foreground size-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8 hover:text-red-400"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
