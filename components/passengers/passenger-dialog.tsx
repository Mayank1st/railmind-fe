"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { toApiError } from "@/lib/api";
import type { Passenger } from "@/lib/passengers";
import { useCreatePassenger } from "@/hooks/useCreatePassenger";
import { useUpdatePassenger } from "@/hooks/useUpdatePassenger";
import {
  draftToPayload,
  EMPTY_DRAFT,
  isDraftValid,
  PassengerFields,
  type PassengerDraft,
} from "@/components/passengers/passenger-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PassengerDialog({
  open,
  onOpenChange,
  passenger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passenger: Passenger | null;
}) {
  const isEdit = Boolean(passenger);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit passenger" : "Add passenger"}
          </DialogTitle>
          <DialogDescription>
            Saved securely and auto-filled during booking.
          </DialogDescription>
        </DialogHeader>

        {/* Keyed + mounted only while open, so the form's state re-seeds from
            the current passenger each time the dialog opens or the target
            changes — no effect needed to sync. */}
        {open && (
          <PassengerForm
            key={passenger?.id ?? "new"}
            passenger={passenger}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function initialDraft(passenger: Passenger | null): PassengerDraft {
  if (!passenger) return EMPTY_DRAFT;
  return {
    full_name: passenger.full_name,
    age: String(passenger.age),
    gender: passenger.gender,
    id_type: passenger.id_type ?? "AADHAAR",
    id_number: passenger.id_number ?? "",
    berth_preference: passenger.berth_preference ?? "NP",
  };
}

function PassengerForm({
  passenger,
  onClose,
}: {
  passenger: Passenger | null;
  onClose: () => void;
}) {
  const create = useCreatePassenger();
  const update = useUpdatePassenger();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  const [draft, setDraft] = useState<PassengerDraft>(() =>
    initialDraft(passenger)
  );
  const [primary, setPrimary] = useState(passenger?.is_primary ?? false);

  async function save() {
    if (!isDraftValid(draft)) return;
    const payload = draftToPayload(draft, primary);
    try {
      if (passenger) {
        await update.mutateAsync({ id: passenger.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch {
      // error surfaced below
    }
  }

  return (
    <>
      <PassengerFields
        draft={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      />

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <Checkbox
          checked={primary}
          onCheckedChange={(v) => setPrimary(Boolean(v))}
        />
        <span className="text-foreground/80">Set as primary traveller</span>
      </label>

      {error && (
        <p className="text-sm text-red-400">{toApiError(error).message}</p>
      )}

      <DialogFooter>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={pending}
          className="rounded-full"
        >
          Cancel
        </Button>
        <Button
          onClick={save}
          disabled={!isDraftValid(draft) || pending}
          className="rounded-full bg-[#E8AA4D] font-medium text-[#3d2817] hover:bg-[#D09840]"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {passenger ? "Save changes" : "Save passenger"}
        </Button>
      </DialogFooter>
    </>
  );
}
