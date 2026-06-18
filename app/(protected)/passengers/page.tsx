"use client";

import { useState } from "react";
import {
  AlertCircle,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toApiError } from "@/lib/api";
import {
  berthLabel,
  genderLabel,
  passengerDoc,
  passengerTag,
  type Passenger,
} from "@/lib/passengers";
import { usePassengers } from "@/hooks/usePassengers";
import { useDeletePassenger } from "@/hooks/useDeletePassenger";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PassengersPage() {
  const { data: passengers = [], isLoading } = usePassengers();
  const deletePassenger = useDeletePassenger();

  const [dialogOpen, setDialogOpen] = useState(false);
  // null = "add" mode, a passenger = "edit" mode.
  const [editing, setEditing] = useState<Passenger | null>(null);
  // Passenger pending delete confirmation.
  const [deleting, setDeleting] = useState<Passenger | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(p: Passenger) {
    setEditing(p);
    setDialogOpen(true);
  }
  function askDelete(p: Passenger) {
    setDeleteError(null);
    setDeleting(p);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await deletePassenger.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (e) {
      setDeleteError(toApiError(e).message);
    }
  }

  return (
    <div className="app-container-narrow py-10">
      {/* Header */}
      <header className="min-w-0">
        <h1 className="font-heading text-foreground text-3xl font-normal tracking-[-0.5px] sm:text-4xl lg:text-5xl">
          Saved passengers
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:mt-3">
          {passengers.length} saved · Auto-fills during booking. ID is masked
          everywhere.
        </p>
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
              onDelete={() => askDelete(p)}
            />
          ))}

          {/* Desktop: dashed add card (mobile uses the button below) */}
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

      {/* Mobile: in-flow add button (the dashed card is desktop-only) */}
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

      {/* Delete confirmation */}
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {deleting?.full_name}?</DialogTitle>
            <DialogDescription>
              This saved passenger will be permanently deleted. You can add them
              again later.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="rounded-xl border-white/12 bg-transparent hover:bg-white/5"
              >
                Keep
              </Button>
            </DialogClose>
            <Button
              onClick={confirmDelete}
              disabled={deletePassenger.isPending}
              className="rounded-xl bg-red-500 font-medium text-white hover:bg-red-600"
            >
              {deletePassenger.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PassengerCard({
  passenger: p,
  onEdit,
  onDelete,
}: {
  passenger: Passenger;
  onEdit: () => void;
  onDelete: () => void;
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Options for ${p.full_name}`}
            className="text-muted-foreground hover:text-foreground size-8 shrink-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
