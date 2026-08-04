"use client";

import { useState } from "react";
import { Check, Loader2, Maximize2 } from "lucide-react";

import {
  KYC_FIELD_META,
  KYC_FIELD_ORDER,
  KYC_GENDER_OPTIONS,
  kycNumberField,
  type KycDocumentType,
  type KycFieldName,
  type KycFormErrors,
  type KycFormValues,
} from "@/lib/kyc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KycNotice } from "@/components/kyc/KycNotice";
import { KycNumberInput } from "@/components/kyc/KycNumberInput";
import { KycPhotoDialog } from "@/components/kyc/KycPhotoDialog";

interface KycConfirmStepProps {
  documentType: KycDocumentType;
  documentLabel: string;
  values: KycFormValues;
  /** The values as first loaded — lets an edited field be marked as such. */
  initialValues: KycFormValues;
  errors: KycFormErrors;
  onChange: (field: KycFieldName, value: string) => void;
  /** `false` for manual entry — no photo was read, so no provenance flags. */
  fromPhoto: boolean;
  /** Fields the reader was asked for and could not make out. */
  unreadableFields: KycFieldName[];
  previewUrl: string | null;
  onRetake: () => void;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}

export function KycConfirmStep({
  documentType,
  documentLabel,
  values,
  initialValues,
  errors,
  onChange,
  fromPhoto,
  unreadableFields,
  previewUrl,
  onRetake,
  confirmed,
  onConfirmedChange,
  onSubmit,
  submitting,
  submitError,
}: KycConfirmStepProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  const unreadable = new Set<string>(unreadableFields);
  const numberField = kycNumberField(documentType);
  const numberUnreadable = fromPhoto && unreadable.has(numberField);

  const fields = KYC_FIELD_ORDER[documentType].filter((field) => {
    // Nothing stores a father's name, so it only earns its space when the card
    // actually gave us one to eyeball.
    if (field === "father_name") return Boolean(values.father_name);
    return true;
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <h2 className="font-heading text-foreground text-3xl sm:text-[34px]">
        {fromPhoto
          ? "Check what we read"
          : `Enter your ${documentLabel} details`}
      </h2>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {fromPhoto
          ? "Every field is editable. Compare each one against the card in your hand before you submit — a wrong digit will fail review."
          : "Type the details exactly as printed on the card. Manual entry goes through the same admin review as a photo."}
      </p>

      {fromPhoto && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          {previewUrl ? (
            // Tapping it opens the photo full size — the print on a card is far
            // too small to check against the form at thumbnail scale.
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              aria-label={`View the ${documentLabel} photo full size`}
              className="group focus-visible:ring-ring/50 relative h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-md border border-white/15 bg-white/[0.03] transition-colors hover:border-white/35 focus-visible:ring-2 focus-visible:outline-none"
            >
              {/* Local object URL — the backend's `document_path` is a private
                  storage path, not a URL, and would render as a broken image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5 text-white" />
              </span>
            </button>
          ) : (
            <div className="h-11 w-14 shrink-0 overflow-hidden rounded-md border border-dashed border-white/15 bg-white/[0.03]">
              <span className="text-muted-foreground flex h-full items-center justify-center font-mono text-[9px]">
                PHOTO
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-medium">
              {documentLabel} — front
            </p>
            <p className="text-muted-foreground text-xs">
              {previewUrl
                ? "Captured just now · tap to enlarge"
                : "Captured just now"}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetake}
            className="text-accent-warm shrink-0 text-sm font-medium hover:underline"
          >
            Retake
          </button>
        </div>
      )}

      {previewUrl && (
        <KycPhotoDialog
          src={previewUrl}
          alt={`${documentLabel} — front`}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}

      {numberUnreadable && (
        <KycNotice
          variant="attention"
          title={`We could not read the ${documentLabel} number on this photo`}
          className="mt-4"
          actions={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onRetake}
              className="h-8 rounded-lg bg-white/8 px-3 text-xs font-medium hover:bg-white/12"
            >
              Retake photo
            </Button>
          }
        >
          Glare or a cut-off edge usually causes this. Retake the photo with the
          whole card in frame and even light, or type the number yourself — both
          are fine.
        </KycNotice>
      )}

      <div className="mt-6 space-y-5">
        {fields.map((field) => (
          <FieldRow
            key={field}
            field={field}
            documentType={documentType}
            value={values[field]}
            initialValue={initialValues[field]}
            error={errors[field]}
            onChange={onChange}
            fromPhoto={fromPhoto}
            needsInput={fromPhoto && unreadable.has(field)}
          />
        ))}
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(checked) => onConfirmedChange(checked === true)}
          className="mt-0.5"
        />
        <span className="text-[13px] leading-relaxed text-white/80">
          I confirm these details match my {documentLabel} card exactly.
        </span>
      </label>

      {submitError && (
        <KycNotice
          variant="blocked"
          title="We could not save that"
          className="mt-4"
        >
          {submitError}
        </KycNotice>
      )}

      <Button
        type="submit"
        disabled={!confirmed || submitting}
        className="bg-accent-warm hover:bg-accent-warm/90 mt-4 h-11 w-full rounded-lg text-sm font-medium text-[#3d2817]"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Submitting…" : "Confirm and submit for review"}
      </Button>

      <button
        type="button"
        onClick={onRetake}
        className="text-foreground mt-4 w-full text-center text-sm font-semibold hover:text-white/70"
      >
        {fromPhoto ? "Retake photo" : "Photograph the card instead"}
      </button>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        Nothing is submitted until you tap Confirm.
      </p>
    </form>
  );
}

/* ── One labelled field + its provenance flag ───────────────── */

interface FieldRowProps {
  field: KycFieldName;
  documentType: KycDocumentType;
  value: string;
  initialValue: string;
  error?: string;
  onChange: (field: KycFieldName, value: string) => void;
  fromPhoto: boolean;
  needsInput: boolean;
}

function FieldRow({
  field,
  documentType,
  value,
  initialValue,
  error,
  onChange,
  fromPhoto,
  needsInput,
}: FieldRowProps) {
  const meta = KYC_FIELD_META[field];
  const id = `kyc-${field}`;
  const hintId = `${id}-hint`;
  const edited = fromPhoto && !needsInput && value !== initialValue;
  const readFromPhoto = fromPhoto && !needsInput && Boolean(initialValue);
  const invalid = Boolean(error);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase"
        >
          {meta.label}
        </label>
        {needsInput ? (
          <span className="text-accent-warm flex items-center gap-1.5 text-[11px] font-medium tracking-wider uppercase">
            <span className="bg-accent-warm h-1.5 w-1.5 rounded-full" />
            Needs your input
          </span>
        ) : edited ? (
          <span className="text-muted-foreground text-[11px]">
            Edited by you
          </span>
        ) : readFromPhoto ? (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Check className="h-3 w-3" />
            Read from photo
          </span>
        ) : null}
      </div>

      <div className="mt-2">
        <FieldControl
          id={id}
          field={field}
          documentType={documentType}
          value={value}
          onChange={onChange}
          invalid={invalid}
          needsInput={needsInput}
          describedBy={error || needsInput ? hintId : undefined}
        />
      </div>

      {error ? (
        <p id={hintId} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : needsInput || !meta.editable ? (
        <p id={hintId} className="text-muted-foreground mt-1.5 text-xs">
          {meta.hint}
        </p>
      ) : null}
    </div>
  );
}

interface FieldControlProps {
  id: string;
  field: KycFieldName;
  documentType: KycDocumentType;
  value: string;
  onChange: (field: KycFieldName, value: string) => void;
  invalid: boolean;
  needsInput: boolean;
  describedBy?: string;
}

function FieldControl({
  id,
  field,
  documentType,
  value,
  onChange,
  invalid,
  needsInput,
  describedBy,
}: FieldControlProps) {
  const meta = KYC_FIELD_META[field];
  const inputClass = cn(
    "h-11 rounded-lg border-white/12 bg-white/[0.02] text-[15px]",
    (invalid || needsInput) && !value && "border-red-500/50 bg-red-500/[0.06]",
    invalid && "border-red-500/50 bg-red-500/[0.06]"
  );

  if (meta.kind === "id-number") {
    return (
      <KycNumberInput
        id={id}
        documentType={documentType}
        value={value}
        onChange={(raw) => onChange(field, raw)}
        invalid={invalid || (needsInput && !value)}
        placeholder={documentType === "AADHAAR" ? "12 digits" : "ABCDE1234F"}
        describedBy={describedBy}
      />
    );
  }

  if (meta.kind === "gender") {
    return (
      <Select value={value} onValueChange={(next) => onChange(field, next)}>
        <SelectTrigger
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(inputClass, "w-full")}
        >
          <SelectValue placeholder="Select gender" />
        </SelectTrigger>
        <SelectContent>
          {KYC_GENDER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (meta.kind === "date") {
    return (
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/YYYY"
        maxLength={10}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(inputClass, "font-mono tracking-wide")}
      />
    );
  }

  return (
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(field, event.target.value)}
      readOnly={!meta.editable}
      disabled={!meta.editable}
      autoComplete="off"
      spellCheck={false}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={cn(inputClass, !meta.editable && "text-muted-foreground")}
    />
  );
}
