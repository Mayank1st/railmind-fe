"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

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
        <div className="min-w-0">
          <h1 className="font-heading text-foreground text-3xl font-normal tracking-[-0.5px] sm:text-4xl lg:text-5xl">
            Saved passengers
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:mt-3">
            {passengers.length} saved · Auto-fills during booking. ID is masked
            everywhere.
          </p>
        </div>

        {/* Desktop: header button. Mobile uses the pinned bottom button. */}
        <Button
          onClick={openAdd}
          className="hidden shrink-0 rounded-full bg-[#E8AA4D] px-5 font-medium text-[#3d2817] hover:bg-[#D09840] md:inline-flex"
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
            className="text-muted-foreground hover:text-foreground bg-card/20 hover:bg-card/40 hidden min-h-[132px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 text-sm transition-colors hover:border-white/20 md:flex"
          >
            <Plus className="h-4 w-4" />
            Add new passenger
          </button>
        </div>
      )}

      {/* Mobile: Add button sits in flow below the list, so it moves down as
          more passengers are added. Desktop uses the header button. */}
      <Button
        onClick={openAdd}
        className="mt-4 h-12 w-full rounded-xl bg-[#E8AA4D] text-base font-medium text-[#3d2817] hover:bg-[#D09840] md:hidden"
      >
        <Plus className="h-5 w-5" />
        Add passenger
      </Button>

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
        "flex items-start gap-4 rounded-2xl border border-white/8 p-5",
        p.is_primary ? "bg-[#E8AA4D]/[0.06]" : "bg-card/40"
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3d2817] text-sm font-medium text-[#E8AA4D]">
        {getInitials(p.full_name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-[15px] font-semibold">
            {p.full_name}
          </span>
          {tag && (
            <Badge className="h-5 bg-[#3d2817] px-2 text-[10px] font-semibold tracking-wide text-[#E8AA4D]">
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

      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        aria-label={`Edit ${p.full_name}`}
        className="text-muted-foreground hover:text-foreground size-8 shrink-0"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
