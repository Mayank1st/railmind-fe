"use client";

import { cn } from "@/lib/utils";
import {
  BERTH_OPTIONS,
  GENDER_OPTIONS,
  ID_TYPE_OPTIONS,
  type CreatePassengerPayload,
} from "@/lib/passengers";
import {
  idNumberHint,
  idNumberMaxLength,
  isIdNumberValid,
  normalizeIdNumber,
  validateIdNumber,
} from "@/lib/document";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PassengerDraft = {
  full_name: string;
  age: string; // string while typing
  gender: string;
  id_type: string;
  id_number: string;
  berth_preference: string;
};

export const EMPTY_DRAFT: PassengerDraft = {
  full_name: "",
  age: "",
  gender: "",
  id_type: "AADHAAR",
  id_number: "",
  berth_preference: "NP",
};

export function isDraftValid(d: PassengerDraft) {
  return (
    d.full_name.trim().length > 1 &&
    Number(d.age) > 0 &&
    Boolean(d.gender) &&
    // Per-document format + length check (Aadhaar 12 digits, PAN AAAAA9999A, …).
    isIdNumberValid(d.id_type, d.id_number)
  );
}

export function draftToPayload(
  d: PassengerDraft,
  isPrimary = false
): CreatePassengerPayload {
  return {
    full_name: d.full_name.trim(),
    age: Number(d.age),
    gender: d.gender,
    id_type: d.id_type,
    // Store the canonical form (uppercased, no separators).
    id_number: normalizeIdNumber(d.id_number),
    berth_preference: d.berth_preference,
    is_primary: isPrimary,
  };
}

const FIELD = "h-10 bg-[#2a2a28] text-[15px] dark:bg-[#2a2a28]";
// SelectTrigger ships its own `data-[size=default]:h-8` (higher specificity than
// a plain `h-10`), so we override at the same specificity to match the inputs.
const TRIGGER =
  "h-10 w-full bg-[#2a2a28] text-[15px] data-[size=default]:h-10 dark:bg-[#2a2a28] dark:hover:bg-[#2f2f2d]";

export function PassengerFields({
  draft,
  onChange,
}: {
  draft: PassengerDraft;
  onChange: (patch: Partial<PassengerDraft>) => void;
}) {
  // Only surface the format error once the user has typed something — don't
  // shout "required" on a pristine field.
  const idError = draft.id_number.trim()
    ? validateIdNumber(draft.id_type, draft.id_number)
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldShell label="Full name" className="sm:col-span-2">
        <Input
          value={draft.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
          placeholder="As printed on the ID"
          className={FIELD}
        />
      </FieldShell>

      <FieldShell label="Age">
        <Input
          type="number"
          min={0}
          value={draft.age}
          onChange={(e) => onChange({ age: e.target.value })}
          placeholder="e.g. 28"
          className={FIELD}
        />
      </FieldShell>

      <FieldShell label="Gender">
        <Select
          value={draft.gender}
          onValueChange={(v) => onChange({ gender: v })}
        >
          <SelectTrigger className={TRIGGER}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>

      <FieldShell label="ID type">
        <Select
          value={draft.id_type}
          onValueChange={(v) => onChange({ id_type: v })}
        >
          <SelectTrigger className={TRIGGER}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ID_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>

      <FieldShell label="ID number">
        <Input
          value={draft.id_number}
          onChange={(e) =>
            onChange({ id_number: e.target.value.toUpperCase() })
          }
          placeholder={idNumberHint(draft.id_type)}
          maxLength={idNumberMaxLength(draft.id_type)}
          inputMode={draft.id_type === "AADHAAR" ? "numeric" : "text"}
          autoCapitalize="characters"
          className={FIELD}
          aria-invalid={Boolean(idError)}
        />
        {idError && <p className="text-xs text-red-400">{idError}</p>}
      </FieldShell>

      <FieldShell label="Default berth" className="sm:col-span-2">
        <Select
          value={draft.berth_preference}
          onValueChange={(v) => onChange({ berth_preference: v })}
        >
          <SelectTrigger className={TRIGGER}>
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
      </FieldShell>
    </div>
  );
}

function FieldShell({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-muted-foreground text-xs tracking-[0.12em] uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}
