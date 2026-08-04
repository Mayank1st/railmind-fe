"use client";

import { useRef } from "react";
import { Camera, CreditCard, Loader2, Upload } from "lucide-react";

import {
  KYC_ACCEPT_ATTR,
  KYC_DOCUMENT_OPTIONS,
  type KycDocumentType,
  type KycFileRejection,
} from "@/lib/kyc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KycNotice } from "@/components/kyc/KycNotice";

interface KycCaptureStepProps {
  documentType: KycDocumentType;
  onDocumentTypeChange: (documentType: KycDocumentType) => void;
  /**
   * Per-type status for documents already on the account: `disabled` locks a
   * type the user did not come here to replace, and `note` says why.
   */
  optionStates: Partial<
    Record<KycDocumentType, { disabled: boolean; note: string }>
  >;
  onPickFile: (file: File) => void;
  onManualEntry: () => void;
  /** A file we refused before uploading (too large, PDF, HEIC, …). */
  rejection: KycFileRejection | null;
  /**
   * RM-KYC-005 — the reader could not make out the card number and refuses to
   * guess a digit. An expected outcome, so it asks for a retake rather than
   * reading as a failure the user caused.
   */
  readFailure: string | null;
  busy: boolean;
}

export function KycCaptureStep({
  documentType,
  onDocumentTypeChange,
  optionStates,
  onPickFile,
  onManualEntry,
  rejection,
  readFailure,
  busy,
}: KycCaptureStepProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    event.target.value = "";
    if (file) onPickFile(file);
  }

  const activeLabel =
    KYC_DOCUMENT_OPTIONS.find((o) => o.value === documentType)?.label ?? "card";

  return (
    <div>
      <h2 className="font-heading text-foreground text-3xl sm:text-[34px]">
        Add your ID document
      </h2>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        Tatkal, ladies quota and senior citizen concession bookings need one
        verified government ID on your account.
      </p>

      <p className="text-muted-foreground mt-7 text-[11px] font-medium tracking-wider uppercase">
        Document type
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {KYC_DOCUMENT_OPTIONS.map((option) => {
          const selected = option.value === documentType;
          const state = optionStates[option.value];
          const locked = state?.disabled ?? false;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={locked}
              onClick={() => onDocumentTypeChange(option.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                locked
                  ? "cursor-not-allowed border-white/8 bg-white/[0.01]"
                  : selected
                    ? "border-accent-warm bg-accent-warm/[0.07]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
              )}
            >
              <span
                className={cn(
                  "block text-sm font-semibold",
                  locked
                    ? "text-muted-foreground"
                    : selected
                      ? "text-accent-warm"
                      : "text-foreground"
                )}
              >
                {option.label}
              </span>
              <span className="text-muted-foreground mt-0.5 block text-xs">
                {option.hint}
              </span>
              {state && (
                <span
                  className={cn(
                    "mt-1.5 block text-[11px]",
                    locked ? "text-muted-foreground" : "text-accent-warm"
                  )}
                >
                  {state.note}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Capture panel */}
      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.015] p-4">
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/12 bg-white/[0.02] sm:h-36">
          <CreditCard className="text-muted-foreground h-5 w-5" />
          <p className="text-muted-foreground text-[13px]">
            Place the whole card inside the frame
          </p>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept={KYC_ACCEPT_ATTR}
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
        <input
          ref={uploadRef}
          type="file"
          accept={KYC_ACCEPT_ATTR}
          className="hidden"
          onChange={handleChange}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="bg-accent-warm hover:bg-accent-warm/90 h-11 rounded-lg text-sm font-medium text-[#3d2817]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Take photo
          </Button>
          <Button
            variant="outline"
            onClick={() => uploadRef.current?.click()}
            disabled={busy}
            className="h-11 rounded-lg border-white/12 bg-transparent text-sm font-medium hover:bg-white/[0.04]"
          >
            <Upload className="h-4 w-4" />
            Upload file
          </Button>
        </div>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span>JPEG, PNG or WebP</span>
          <span aria-hidden>·</span>
          <span>Up to 5 MB</span>
          <span aria-hidden>·</span>
          <span>All four corners visible, no flash glare</span>
        </div>
      </div>

      {readFailure && (
        <KycNotice
          variant="attention"
          title={`We could not read the ${activeLabel} number on this photo`}
          className="mt-4"
          actions={
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => cameraRef.current?.click()}
                className="h-8 rounded-lg bg-white/8 px-3 text-xs font-medium hover:bg-white/12"
              >
                Retake photo
              </Button>
              <button
                type="button"
                onClick={onManualEntry}
                className="text-accent-warm text-xs font-medium hover:underline"
              >
                Type it manually
              </button>
            </>
          }
        >
          {readFailure} Glare or a cut-off edge usually causes this. Retake the
          photo with the whole card in frame and even light, or type the number
          yourself — both are fine.
        </KycNotice>
      )}

      {rejection && (
        <KycNotice variant="blocked" title={rejection.title} className="mt-4">
          {rejection.detail}
        </KycNotice>
      )}

      <KycNotice variant="privacy" className="mt-4">
        Your photo is used only to read the details printed on the card. It is
        stored encrypted, seen only by our verification team, and deleted once
        your KYC is approved. We never share it with third parties.
      </KycNotice>

      <button
        type="button"
        onClick={onManualEntry}
        className="text-accent-warm mt-6 text-sm underline underline-offset-4 hover:no-underline"
      >
        Enter the details manually instead
      </button>
    </div>
  );
}
